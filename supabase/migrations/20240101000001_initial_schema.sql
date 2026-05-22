-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'starter',
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name           TEXT NOT NULL DEFAULT '',
  email               TEXT NOT NULL DEFAULT '',
  role                TEXT NOT NULL DEFAULT 'inspector'
                        CHECK (role IN ('admin','manager','inspector','analyst','reviewer','viewer')),
  division_id         UUID,
  avatar_url          TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DIVISIONS
-- ============================================================
CREATE TABLE divisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  parent_id       UUID REFERENCES divisions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SITES (locations)
-- ============================================================
CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip             TEXT,
  latitude        DECIMAL(10, 8),
  longitude       DECIMAL(11, 8),
  metadata        JSONB NOT NULL DEFAULT '{}',
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INSPECTION TEMPLATES
-- ============================================================
CREATE TABLE inspection_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'general',
  version         INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEMPLATE SECTIONS
-- ============================================================
CREATE TABLE template_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEMPLATE QUESTIONS
-- ============================================================
CREATE TABLE template_questions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id               UUID NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
  template_id              UUID NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question_text            TEXT NOT NULL,
  question_type            TEXT NOT NULL DEFAULT 'yes_no'
                             CHECK (question_type IN ('yes_no','pass_fail','multiple_choice','dropdown','notes','evidence_upload','signature','severity','conditional')),
  options                  JSONB NOT NULL DEFAULT '[]',
  is_required              BOOLEAN NOT NULL DEFAULT TRUE,
  triggers_finding         BOOLEAN NOT NULL DEFAULT FALSE,
  finding_on_values        TEXT[] NOT NULL DEFAULT '{}',
  reporting_metadata       JSONB NOT NULL DEFAULT '{}',
  order_index              INTEGER NOT NULL DEFAULT 0,
  conditional_parent_id    UUID REFERENCES template_questions(id) ON DELETE SET NULL,
  conditional_trigger_value TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INSPECTIONS
-- ============================================================
CREATE TABLE inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id     UUID NOT NULL REFERENCES inspection_templates(id),
  inspector_id    UUID NOT NULL REFERENCES auth.users(id),
  site_id         UUID NOT NULL REFERENCES sites(id),
  division_id     UUID REFERENCES divisions(id),
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','in_progress','submitted','under_review','approved','rejected')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES auth.users(id),
  approval_notes  TEXT,
  gps_location    JSONB,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INSPECTION RESPONSES
-- ============================================================
CREATE TABLE inspection_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES template_questions(id),
  question_text   TEXT NOT NULL,
  question_type   TEXT NOT NULL,
  response_value  TEXT,
  response_text   TEXT,
  severity        TEXT CHECK (severity IN ('critical','high','medium','low','info')),
  has_finding     BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FINDINGS
-- ============================================================
CREATE TABLE findings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inspection_id      UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  response_id        UUID REFERENCES inspection_responses(id) ON DELETE SET NULL,
  question_id        UUID REFERENCES template_questions(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  severity           TEXT NOT NULL DEFAULT 'medium'
                       CHECK (severity IN ('critical','high','medium','low','info')),
  status             TEXT NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','in_progress','resolved','closed','waived')),
  category           TEXT,
  site_id            UUID NOT NULL REFERENCES sites(id),
  division_id        UUID REFERENCES divisions(id),
  inspector_id       UUID NOT NULL REFERENCES auth.users(id),
  assigned_to        UUID REFERENCES auth.users(id),
  due_date           DATE,
  resolved_at        TIMESTAMPTZ,
  evidence_count     INTEGER NOT NULL DEFAULT 0,
  reporting_metadata JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CORRECTIVE ACTIONS
-- ============================================================
CREATE TABLE corrective_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finding_id      UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  inspection_id   UUID NOT NULL REFERENCES inspections(id),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','completed','verified','overdue')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('critical','high','medium','low','info')),
  assigned_to     UUID REFERENCES auth.users(id),
  assigned_by     UUID REFERENCES auth.users(id),
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES auth.users(id),
  evidence_links  TEXT[] NOT NULL DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVIDENCE
-- ============================================================
CREATE TABLE evidence (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inspection_id        UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  finding_id           UUID REFERENCES findings(id) ON DELETE SET NULL,
  corrective_action_id UUID REFERENCES corrective_actions(id) ON DELETE SET NULL,
  uploader_id          UUID NOT NULL REFERENCES auth.users(id),
  file_name            TEXT NOT NULL,
  file_path            TEXT NOT NULL,
  file_size            BIGINT NOT NULL DEFAULT 0,
  file_type            TEXT NOT NULL,
  storage_bucket       TEXT NOT NULL DEFAULT 'evidence',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  metadata        JSONB NOT NULL DEFAULT '{}',
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ONBOARDING STATE
-- ============================================================
CREATE TABLE onboarding_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  current_step    INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  data            JSONB NOT NULL DEFAULT '{}',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER inspection_templates_updated_at BEFORE UPDATE ON inspection_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER inspections_updated_at BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER findings_updated_at BEFORE UPDATE ON findings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER corrective_actions_updated_at BEFORE UPDATE ON corrective_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER onboarding_state_updated_at BEFORE UPDATE ON onboarding_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  INSERT INTO onboarding_state (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_divisions_organization ON divisions(organization_id);
CREATE INDEX idx_sites_organization ON sites(organization_id);
CREATE INDEX idx_templates_organization ON inspection_templates(organization_id);
CREATE INDEX idx_template_sections_template ON template_sections(template_id);
CREATE INDEX idx_template_questions_section ON template_questions(section_id);
CREATE INDEX idx_template_questions_template ON template_questions(template_id);
CREATE INDEX idx_inspections_organization ON inspections(organization_id);
CREATE INDEX idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX idx_inspections_site ON inspections(site_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_responses_inspection ON inspection_responses(inspection_id);
CREATE INDEX idx_findings_organization ON findings(organization_id);
CREATE INDEX idx_findings_inspection ON findings(inspection_id);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_assigned ON findings(assigned_to);
CREATE INDEX idx_ca_organization ON corrective_actions(organization_id);
CREATE INDEX idx_ca_finding ON corrective_actions(finding_id);
CREATE INDEX idx_ca_status ON corrective_actions(status);
CREATE INDEX idx_ca_assigned ON corrective_actions(assigned_to);
CREATE INDEX idx_evidence_inspection ON evidence(inspection_id);
CREATE INDEX idx_audit_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_onboarding_user ON onboarding_state(user_id);
