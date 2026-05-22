from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import get_current_user
from app.database import get_supabase

router = APIRouter(prefix="/templates", tags=["templates"])


class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "general"


class SectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0


class QuestionCreate(BaseModel):
    question_text: str
    question_type: str = "yes_no"
    is_required: bool = True
    triggers_finding: bool = False
    finding_on_values: list[str] = []
    options: list[dict] = []
    order_index: int = 0
    reporting_metadata: dict = {}


@router.get("/")
async def list_templates(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("inspection_templates")
        .select("*, sections:template_sections(id, title, order_index)")
        .eq("organization_id", current_user["org_id"])
        .eq("is_active", True)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreate,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    result = supabase.table("inspection_templates").insert({
        "organization_id": current_user["org_id"],
        "name": payload.name,
        "description": payload.description,
        "category": payload.category,
        "created_by": current_user["user_id"],
    }).execute()
    return result.data[0]


@router.get("/{template_id}")
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    result = (
        supabase.table("inspection_templates")
        .select("*")
        .eq("id", template_id)
        .eq("organization_id", current_user["org_id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Template not found")

    sections = (
        supabase.table("template_sections")
        .select("*, questions:template_questions(*)")
        .eq("template_id", template_id)
        .order("order_index")
        .execute()
    )
    return {**result.data, "sections": sections.data}
