from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime, date
from enum import Enum


class InspectionStatus(str, Enum):
    draft = "draft"
    in_progress = "in_progress"
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"


class SeverityLevel(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class FindingStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    waived = "waived"


class ActionStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    verified = "verified"
    overdue = "overdue"


class InspectionCreate(BaseModel):
    template_id: str
    site_id: str
    division_id: Optional[str] = None


class InspectionResponse(BaseModel):
    id: str
    organization_id: str
    template_id: str
    inspector_id: str
    site_id: str
    status: InspectionStatus
    started_at: datetime
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ResponseSubmit(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    response_value: Optional[str] = None
    response_text: Optional[str] = None
    severity: Optional[SeverityLevel] = None
    notes: Optional[str] = None


class InspectionSubmit(BaseModel):
    responses: list[ResponseSubmit]


class FindingUpdate(BaseModel):
    status: Optional[FindingStatus] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class ActionUpdate(BaseModel):
    status: Optional[ActionStatus] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class ExportFormat(str, Enum):
    csv = "csv"
    json = "json"


class ReportRequest(BaseModel):
    format: ExportFormat = ExportFormat.csv
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    include_findings: bool = True
    include_actions: bool = True
