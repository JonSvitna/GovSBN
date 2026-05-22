import csv
import io
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.schemas.inspection import ReportRequest, ExportFormat

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
async def get_summary(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    inspections = supabase.table("inspections").select("status").eq("organization_id", org_id).execute()
    findings = supabase.table("findings").select("status, severity").eq("organization_id", org_id).execute()
    actions = supabase.table("corrective_actions").select("status").eq("organization_id", org_id).execute()

    def count_by(items, key):
        result = {}
        for item in items:
            v = item.get(key, "unknown")
            result[v] = result.get(v, 0) + 1
        return result

    return {
        "inspections": {
            "total": len(inspections.data),
            "by_status": count_by(inspections.data, "status"),
        },
        "findings": {
            "total": len(findings.data),
            "open": sum(1 for f in findings.data if f["status"] == "open"),
            "resolved": sum(1 for f in findings.data if f["status"] == "resolved"),
            "by_severity": count_by(findings.data, "severity"),
            "by_status": count_by(findings.data, "status"),
        },
        "corrective_actions": {
            "total": len(actions.data),
            "overdue": sum(1 for a in actions.data if a["status"] == "overdue"),
            "completed": sum(1 for a in actions.data if a["status"] in ("completed", "verified")),
            "by_status": count_by(actions.data, "status"),
        },
    }


@router.post("/export")
async def export_report(
    payload: ReportRequest,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    insp_query = (
        supabase.table("inspections")
        .select("id, status, started_at, submitted_at, template:inspection_templates(name,category), site:sites(name,city,state), inspector:profiles(full_name)")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
    )
    if payload.date_from:
        insp_query = insp_query.gte("created_at", str(payload.date_from))
    if payload.date_to:
        insp_query = insp_query.lte("created_at", str(payload.date_to))

    inspections = insp_query.execute().data

    findings_data = []
    if payload.include_findings:
        f_query = (
            supabase.table("findings")
            .select("id, title, severity, status, category, due_date, created_at, site:sites(name)")
            .eq("organization_id", org_id)
            .order("created_at", desc=True)
        )
        if payload.date_from:
            f_query = f_query.gte("created_at", str(payload.date_from))
        findings_data = f_query.execute().data

    actions_data = []
    if payload.include_actions:
        a_query = (
            supabase.table("corrective_actions")
            .select("id, title, status, priority, due_date, completed_at, created_at")
            .eq("organization_id", org_id)
            .order("created_at", desc=True)
        )
        if payload.date_from:
            a_query = a_query.gte("created_at", str(payload.date_from))
        actions_data = a_query.execute().data

    if payload.format == ExportFormat.json:
        return JSONResponse({
            "inspections": inspections,
            "findings": findings_data,
            "corrective_actions": actions_data,
            "metadata": {
                "exported_at": "now",
                "organization_id": org_id,
                "powerbi_ready": True,
            },
        })

    # CSV export
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== INSPECTIONS ==="])
    writer.writerow(["ID", "Template", "Category", "Site", "City", "State", "Inspector", "Status", "Started At", "Submitted At"])
    for i in inspections:
        writer.writerow([
            i["id"],
            i.get("template", {}).get("name", ""),
            i.get("template", {}).get("category", ""),
            i.get("site", {}).get("name", ""),
            i.get("site", {}).get("city", ""),
            i.get("site", {}).get("state", ""),
            i.get("inspector", {}).get("full_name", ""),
            i["status"],
            i.get("started_at", ""),
            i.get("submitted_at", ""),
        ])

    if findings_data:
        writer.writerow([])
        writer.writerow(["=== FINDINGS ==="])
        writer.writerow(["ID", "Title", "Severity", "Status", "Category", "Site", "Due Date", "Created At"])
        for f in findings_data:
            writer.writerow([
                f["id"], f["title"], f["severity"], f["status"], f.get("category", ""),
                f.get("site", {}).get("name", ""), f.get("due_date", ""), f.get("created_at", ""),
            ])

    if actions_data:
        writer.writerow([])
        writer.writerow(["=== CORRECTIVE ACTIONS ==="])
        writer.writerow(["ID", "Title", "Status", "Priority", "Due Date", "Completed At", "Created At"])
        for a in actions_data:
            writer.writerow([
                a["id"], a["title"], a["status"], a["priority"],
                a.get("due_date", ""), a.get("completed_at", ""), a.get("created_at", ""),
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=govsbn-report.csv"},
    )
