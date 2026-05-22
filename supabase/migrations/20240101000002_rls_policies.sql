-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_state ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's organization_id
CREATE OR REPLACE FUNCTION auth_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is admin or manager
CREATE OR REPLACE FUNCTION auth_is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin','manager') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = auth_organization_id());

CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE USING (id = auth_organization_id() AND auth_is_admin_or_manager());

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own_org" ON profiles
  FOR SELECT USING (
    organization_id = auth_organization_id() OR id = auth.uid()
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (
    organization_id = auth_organization_id() AND auth_is_admin_or_manager()
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- DIVISIONS
-- ============================================================
CREATE POLICY "divisions_org_access" ON divisions
  FOR ALL USING (organization_id = auth_organization_id());

-- ============================================================
-- SITES
-- ============================================================
CREATE POLICY "sites_org_access" ON sites
  FOR ALL USING (organization_id = auth_organization_id());

-- ============================================================
-- INSPECTION TEMPLATES
-- ============================================================
CREATE POLICY "templates_org_select" ON inspection_templates
  FOR SELECT USING (organization_id = auth_organization_id());

CREATE POLICY "templates_org_write" ON inspection_templates
  FOR INSERT WITH CHECK (organization_id = auth_organization_id());

CREATE POLICY "templates_org_update" ON inspection_templates
  FOR UPDATE USING (organization_id = auth_organization_id());

CREATE POLICY "templates_admin_delete" ON inspection_templates
  FOR DELETE USING (
    organization_id = auth_organization_id() AND auth_is_admin_or_manager()
  );

-- ============================================================
-- TEMPLATE SECTIONS
-- ============================================================
CREATE POLICY "sections_org_access" ON template_sections
  FOR ALL USING (organization_id = auth_organization_id());

-- ============================================================
-- TEMPLATE QUESTIONS
-- ============================================================
CREATE POLICY "questions_org_access" ON template_questions
  FOR ALL USING (organization_id = auth_organization_id());

-- ============================================================
-- INSPECTIONS
-- ============================================================
CREATE POLICY "inspections_org_select" ON inspections
  FOR SELECT USING (organization_id = auth_organization_id());

CREATE POLICY "inspections_own_insert" ON inspections
  FOR INSERT WITH CHECK (
    organization_id = auth_organization_id() AND inspector_id = auth.uid()
  );

CREATE POLICY "inspections_own_update" ON inspections
  FOR UPDATE USING (
    organization_id = auth_organization_id() AND
    (inspector_id = auth.uid() OR auth_is_admin_or_manager())
  );

-- ============================================================
-- INSPECTION RESPONSES
-- ============================================================
CREATE POLICY "responses_org_access" ON inspection_responses
  FOR ALL USING (organization_id = auth_organization_id());

-- ============================================================
-- FINDINGS
-- ============================================================
CREATE POLICY "findings_org_select" ON findings
  FOR SELECT USING (organization_id = auth_organization_id());

CREATE POLICY "findings_org_insert" ON findings
  FOR INSERT WITH CHECK (organization_id = auth_organization_id());

CREATE POLICY "findings_org_update" ON findings
  FOR UPDATE USING (organization_id = auth_organization_id());

-- ============================================================
-- CORRECTIVE ACTIONS
-- ============================================================
CREATE POLICY "ca_org_select" ON corrective_actions
  FOR SELECT USING (organization_id = auth_organization_id());

CREATE POLICY "ca_org_insert" ON corrective_actions
  FOR INSERT WITH CHECK (organization_id = auth_organization_id());

CREATE POLICY "ca_org_update" ON corrective_actions
  FOR UPDATE USING (organization_id = auth_organization_id());

-- ============================================================
-- EVIDENCE
-- ============================================================
CREATE POLICY "evidence_org_access" ON evidence
  FOR ALL USING (organization_id = auth_organization_id());

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE POLICY "audit_org_select" ON audit_logs
  FOR SELECT USING (organization_id = auth_organization_id());

CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    organization_id = auth_organization_id() AND user_id = auth.uid()
  );

-- ============================================================
-- ONBOARDING STATE
-- ============================================================
CREATE POLICY "onboarding_own" ON onboarding_state
  FOR ALL USING (user_id = auth.uid());
