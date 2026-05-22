from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.schemas.inspection import FindingUpdate

router = APIRouter(prefix="/findings", tags=["findings"])


@router.get("/")
async def list_findings(
    status: str | None = None,
    severity: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    query = (
        supabase.table("findings")
        .select("*, site:sites(name), inspection:inspections(id,started_at)")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    if severity:
        query = query.eq("severity", severity)

    result = query.execute()
    return result.data


@router.get("/{finding_id}")
async def get_finding(
    finding_id: str,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    result = (
        supabase.table("findings")
        .select("*, site:sites(name,city,state), inspection:inspections(id,started_at)")
        .eq("id", finding_id)
        .eq("organization_id", org_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Finding not found")
    return result.data


@router.patch("/{finding_id}")
async def update_finding(
    finding_id: str,
    payload: FindingUpdate,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    updates = payload.model_dump(exclude_none=True)
    if "status" in updates and updates["status"] == "resolved":
        updates["resolved_at"] = "now()"

    result = (
        supabase.table("findings")
        .update(updates)
        .eq("id", finding_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Finding not found")
    return result.data[0]
