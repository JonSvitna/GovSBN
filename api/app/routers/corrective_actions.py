from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.schemas.inspection import ActionUpdate

router = APIRouter(prefix="/corrective-actions", tags=["corrective-actions"])


@router.get("/")
async def list_actions(
    status: str | None = None,
    assigned_to_me: bool = False,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    query = (
        supabase.table("corrective_actions")
        .select("*, finding:findings(title,severity), assignee:profiles!corrective_actions_assigned_to_fkey(full_name)")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    if assigned_to_me:
        query = query.eq("assigned_to", current_user["user_id"])

    result = query.execute()
    return result.data


@router.get("/{action_id}")
async def get_action(
    action_id: str,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    result = (
        supabase.table("corrective_actions")
        .select("*, finding:findings(id,title,severity,status)")
        .eq("id", action_id)
        .eq("organization_id", org_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Corrective action not found")
    return result.data


@router.patch("/{action_id}")
async def update_action(
    action_id: str,
    payload: ActionUpdate,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    org_id = current_user["org_id"]

    updates = payload.model_dump(exclude_none=True)
    if "status" in updates and updates["status"] in ("completed", "verified"):
        updates["completed_at"] = "now()"

    result = (
        supabase.table("corrective_actions")
        .update(updates)
        .eq("id", action_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Corrective action not found")
    return result.data[0]
