from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.schemas.inspection import InspectionCreate, InspectionSubmit
from datetime import date

router = APIRouter(prefix="/inspections", tags=["inspections"])


def _org_guard(supabase, org_id: str, inspection_id: str) -> dict:
    result = supabase.table("inspections").select("*").eq("id", inspection_id).eq("organization_id", org_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return result.data


@router.get("/")
async def list_inspections(
    status: str | None = None,
    site_id: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    query = (
        supabase.table("inspections")
        .select("*, template:inspection_templates(name,category), site:sites(name,city), inspector:profiles(full_name)")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    if site_id:
        query = query.eq("site_id", site_id)

    result = query.execute()
    return result.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inspection(
    payload: InspectionCreate,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]
    user_id = current_user["user_id"]

    result = supabase.table("inspections").insert({
        "organization_id": org_id,
        "template_id": payload.template_id,
        "inspector_id": user_id,
        "site_id": payload.site_id,
        "division_id": payload.division_id,
        "status": "in_progress",
    }).execute()

    return result.data[0]


@router.get("/{inspection_id}")
async def get_inspection(
    inspection_id: str,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    result = (
        supabase.table("inspections")
        .select("*, template:inspection_templates(name,category,description), site:sites(name,city,state), inspector:profiles(full_name,email)")
        .eq("id", inspection_id)
        .eq("organization_id", org_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return result.data


@router.post("/{inspection_id}/submit")
async def submit_inspection(
    inspection_id: str,
    payload: InspectionSubmit,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]
    user_id = current_user["user_id"]
    inspection = _org_guard(supabase, org_id, inspection_id)

    # Upsert responses
    response_rows = [
        {
            "inspection_id": inspection_id,
            "organization_id": org_id,
            "question_id": r.question_id,
            "question_text": r.question_text,
            "question_type": r.question_type,
            "response_value": r.response_value,
            "response_text": r.response_text,
            "severity": r.severity,
            "notes": r.notes,
            "has_finding": False,
        }
        for r in payload.responses
    ]
    if response_rows:
        supabase.table("inspection_responses").upsert(
            response_rows, on_conflict="inspection_id,question_id"
        ).execute()

    # Generate findings from triggered questions
    findings_created = []
    for r in payload.responses:
        q_result = supabase.table("template_questions").select("*").eq("id", r.question_id).single().execute()
        q = q_result.data
        if q and q.get("triggers_finding") and r.response_value in (q.get("finding_on_values") or []):
            f_result = supabase.table("findings").insert({
                "organization_id": org_id,
                "inspection_id": inspection_id,
                "question_id": r.question_id,
                "title": f"Finding: {q['question_text']}",
                "description": f"Response: {r.response_value}. {r.notes or ''}".strip(),
                "severity": q.get("reporting_metadata", {}).get("risk_level", "medium"),
                "status": "open",
                "category": q.get("reporting_metadata", {}).get("category", "general"),
                "site_id": inspection["site_id"],
                "inspector_id": user_id,
                "due_date": str(date.fromordinal(date.today().toordinal() + 14)),
                "reporting_metadata": q.get("reporting_metadata", {}),
            }).execute()

            if f_result.data:
                finding = f_result.data[0]
                findings_created.append(finding)
                supabase.table("corrective_actions").insert({
                    "organization_id": org_id,
                    "finding_id": finding["id"],
                    "inspection_id": inspection_id,
                    "title": f"Corrective Action: {q['question_text']}",
                    "description": f"Address finding: {finding['description']}",
                    "status": "pending",
                    "priority": finding["severity"],
                    "assigned_to": user_id,
                    "assigned_by": user_id,
                    "due_date": finding["due_date"],
                }).execute()

    # Mark inspection submitted
    supabase.table("inspections").update({
        "status": "submitted",
        "submitted_at": "now()",
    }).eq("id", inspection_id).execute()

    return {
        "status": "submitted",
        "findings_created": len(findings_created),
        "corrective_actions_created": len(findings_created),
    }


@router.patch("/{inspection_id}/approve")
async def approve_inspection(
    inspection_id: str,
    notes: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]
    _org_guard(supabase, org_id, inspection_id)

    supabase.table("inspections").update({
        "status": "approved",
        "approved_at": "now()",
        "reviewed_by": current_user["user_id"],
        "approval_notes": notes,
    }).eq("id", inspection_id).execute()

    return {"status": "approved"}
