export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
export type InspectionStatus = "draft" | "in_progress" | "submitted" | "under_review" | "approved" | "rejected";
export type FindingStatus = "open" | "in_progress" | "resolved" | "closed" | "waived";
export type ActionStatus = "pending" | "in_progress" | "completed" | "verified" | "overdue";
export type QuestionType = "yes_no" | "pass_fail" | "multiple_choice" | "dropdown" | "notes" | "evidence_upload" | "signature" | "severity" | "conditional";
export type UserRole = "admin" | "manager" | "inspector" | "analyst" | "reviewer" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  division_id: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  parent_id: string | null;
  created_at: string;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: Json;
  active: boolean;
  created_at: string;
}

export interface InspectionTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string;
  version: number;
  is_active: boolean;
  created_by: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface TemplateSection {
  id: string;
  template_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface TemplateQuestion {
  id: string;
  section_id: string;
  template_id: string;
  organization_id: string;
  question_text: string;
  question_type: QuestionType;
  options: Json;
  is_required: boolean;
  triggers_finding: boolean;
  finding_on_values: string[];
  reporting_metadata: Json;
  order_index: number;
  conditional_parent_id: string | null;
  conditional_trigger_value: string | null;
  created_at: string;
}

export interface Inspection {
  id: string;
  organization_id: string;
  template_id: string;
  inspector_id: string;
  site_id: string;
  division_id: string | null;
  status: InspectionStatus;
  started_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  reviewed_by: string | null;
  approval_notes: string | null;
  gps_location: Json | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
  template?: InspectionTemplate;
  site?: Site;
  inspector?: Profile;
}

export interface InspectionResponse {
  id: string;
  inspection_id: string;
  organization_id: string;
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  response_value: string | null;
  response_text: string | null;
  severity: SeverityLevel | null;
  has_finding: boolean;
  notes: string | null;
  created_at: string;
}

export interface Finding {
  id: string;
  organization_id: string;
  inspection_id: string;
  response_id: string | null;
  question_id: string | null;
  title: string;
  description: string | null;
  severity: SeverityLevel;
  status: FindingStatus;
  category: string | null;
  site_id: string;
  division_id: string | null;
  inspector_id: string;
  assigned_to: string | null;
  due_date: string | null;
  resolved_at: string | null;
  evidence_count: number;
  reporting_metadata: Json;
  created_at: string;
  updated_at: string;
  site?: Site;
  inspection?: Inspection;
  assignee?: Profile;
}

export interface CorrectiveAction {
  id: string;
  organization_id: string;
  finding_id: string;
  inspection_id: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  priority: SeverityLevel;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  evidence_links: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  finding?: Finding;
  assignee?: Profile;
}

export interface Evidence {
  id: string;
  organization_id: string;
  inspection_id: string;
  finding_id: string | null;
  corrective_action_id: string | null;
  uploader_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  storage_bucket: string;
  created_at: string;
}

export interface OnboardingState {
  id: string;
  user_id: string;
  organization_id: string | null;
  current_step: number;
  completed_steps: number[];
  data: Json;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
