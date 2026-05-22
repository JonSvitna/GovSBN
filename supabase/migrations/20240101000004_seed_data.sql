-- ============================================================
-- SEED STARTER TEMPLATE DATA (used during onboarding)
-- ============================================================

-- This function creates starter data for a new organization
CREATE OR REPLACE FUNCTION seed_organization_starter_data(
  p_organization_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_template_id UUID;
  v_section1_id UUID;
  v_section2_id UUID;
  v_section3_id UUID;
  v_site_id UUID;
  v_division_id UUID;
  v_inspection_id UUID;
  v_q1_id UUID;
  v_q2_id UUID;
  v_q3_id UUID;
  v_q4_id UUID;
  v_q5_id UUID;
  v_q6_id UUID;
  v_q7_id UUID;
  v_q8_id UUID;
  v_finding_id UUID;
BEGIN
  -- Create starter division
  INSERT INTO divisions (organization_id, name, code)
  VALUES (p_organization_id, 'Operations Division', 'OPS')
  RETURNING id INTO v_division_id;

  -- Create starter site
  INSERT INTO sites (organization_id, name, address, city, state, active)
  VALUES (p_organization_id, 'Headquarters Facility', '100 Government Plaza', 'Capital City', 'DC', TRUE)
  RETURNING id INTO v_site_id;

  -- Create starter inspection template
  INSERT INTO inspection_templates (organization_id, name, description, category, created_by, metadata)
  VALUES (
    p_organization_id,
    'General Facility Inspection',
    'Standard facility safety and compliance inspection template',
    'facility',
    p_user_id,
    '{"powerbi_table": "facility_inspections", "report_category": "operational"}'::jsonb
  )
  RETURNING id INTO v_template_id;

  -- Create sections
  INSERT INTO template_sections (template_id, organization_id, title, description, order_index)
  VALUES (v_template_id, p_organization_id, 'Safety & Emergency Preparedness', 'Emergency systems and safety equipment', 0)
  RETURNING id INTO v_section1_id;

  INSERT INTO template_sections (template_id, organization_id, title, description, order_index)
  VALUES (v_template_id, p_organization_id, 'Facility Conditions', 'Physical facility inspection items', 1)
  RETURNING id INTO v_section2_id;

  INSERT INTO template_sections (template_id, organization_id, title, description, order_index)
  VALUES (v_template_id, p_organization_id, 'Security & Access Control', 'Security systems and access management', 2)
  RETURNING id INTO v_section3_id;

  -- Section 1 questions
  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section1_id, v_template_id, p_organization_id, 'Is emergency signage clearly visible and properly illuminated?', 'yes_no', TRUE, TRUE, ARRAY['no'], '{"category": "safety", "powerbi_field": "emergency_signage", "risk_level": "high"}'::jsonb, 0)
  RETURNING id INTO v_q1_id;

  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section1_id, v_template_id, p_organization_id, 'Are fire extinguishers present, accessible, and within inspection date?', 'pass_fail', TRUE, TRUE, ARRAY['fail'], '{"category": "fire_safety", "powerbi_field": "fire_extinguishers", "risk_level": "critical"}'::jsonb, 1)
  RETURNING id INTO v_q2_id;

  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section1_id, v_template_id, p_organization_id, 'Are emergency exit routes free of obstructions?', 'yes_no', TRUE, TRUE, ARRAY['no'], '{"category": "egress", "powerbi_field": "exit_routes", "risk_level": "critical"}'::jsonb, 2)
  RETURNING id INTO v_q3_id;

  -- Section 2 questions
  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section2_id, v_template_id, p_organization_id, 'Rate the overall condition of the facility', 'severity', TRUE, TRUE, ARRAY['critical', 'high'], '{"category": "facility_condition", "powerbi_field": "facility_rating", "risk_level": "medium"}'::jsonb, 0)
  RETURNING id INTO v_q4_id;

  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section2_id, v_template_id, p_organization_id, 'Are there any visible structural concerns or damage?', 'yes_no', TRUE, TRUE, ARRAY['yes'], '{"category": "structural", "powerbi_field": "structural_concerns", "risk_level": "high"}'::jsonb, 1)
  RETURNING id INTO v_q5_id;

  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section2_id, v_template_id, p_organization_id, 'Provide additional notes on facility conditions', 'notes', FALSE, FALSE, ARRAY[]::text[], '{"category": "facility_notes", "powerbi_field": "facility_notes"}'::jsonb, 2)
  RETURNING id INTO v_q6_id;

  -- Section 3 questions
  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section3_id, v_template_id, p_organization_id, 'Are access control systems functioning properly?', 'pass_fail', TRUE, TRUE, ARRAY['fail'], '{"category": "access_control", "powerbi_field": "access_systems", "risk_level": "high"}'::jsonb, 0)
  RETURNING id INTO v_q7_id;

  INSERT INTO template_questions (section_id, template_id, organization_id, question_text, question_type, is_required, triggers_finding, finding_on_values, reporting_metadata, order_index)
  VALUES (v_section3_id, v_template_id, p_organization_id, 'Select applicable security concerns observed', 'multiple_choice', FALSE, TRUE, ARRAY['unauthorized_access','equipment_damage','missing_signage'], '{"category": "security", "powerbi_field": "security_concerns", "risk_level": "high"}'::jsonb, 1)
  RETURNING id INTO v_q8_id;

  -- Update options for multiple choice question
  UPDATE template_questions SET options = '[
    {"value": "none", "label": "No concerns"},
    {"value": "unauthorized_access", "label": "Unauthorized access attempt"},
    {"value": "equipment_damage", "label": "Security equipment damage"},
    {"value": "missing_signage", "label": "Missing security signage"},
    {"value": "camera_issue", "label": "Camera system issue"}
  ]'::jsonb WHERE id = v_q8_id;

  -- Create a sample completed inspection
  INSERT INTO inspections (organization_id, template_id, inspector_id, site_id, division_id, status, submitted_at, metadata)
  VALUES (
    p_organization_id, v_template_id, p_user_id, v_site_id, v_division_id,
    'approved',
    NOW() - INTERVAL '3 days',
    '{"source": "seed"}'::jsonb
  )
  RETURNING id INTO v_inspection_id;

  -- Create sample responses
  INSERT INTO inspection_responses (inspection_id, organization_id, question_id, question_text, question_type, response_value, has_finding)
  VALUES
    (v_inspection_id, p_organization_id, v_q1_id, 'Is emergency signage clearly visible and properly illuminated?', 'yes_no', 'yes', FALSE),
    (v_inspection_id, p_organization_id, v_q2_id, 'Are fire extinguishers present, accessible, and within inspection date?', 'pass_fail', 'fail', TRUE),
    (v_inspection_id, p_organization_id, v_q3_id, 'Are emergency exit routes free of obstructions?', 'yes_no', 'yes', FALSE),
    (v_inspection_id, p_organization_id, v_q4_id, 'Rate the overall condition of the facility', 'severity', 'medium', FALSE),
    (v_inspection_id, p_organization_id, v_q5_id, 'Are there any visible structural concerns or damage?', 'yes_no', 'no', FALSE),
    (v_inspection_id, p_organization_id, v_q7_id, 'Are access control systems functioning properly?', 'pass_fail', 'pass', FALSE);

  -- Create a sample finding
  INSERT INTO findings (organization_id, inspection_id, question_id, title, description, severity, status, category, site_id, division_id, inspector_id, due_date, reporting_metadata)
  VALUES (
    p_organization_id, v_inspection_id, v_q2_id,
    'Fire Extinguisher Inspection Overdue',
    'Two fire extinguishers in the east wing have passed their annual inspection date. Immediate service required.',
    'high', 'open', 'fire_safety',
    v_site_id, v_division_id, p_user_id,
    CURRENT_DATE + INTERVAL '7 days',
    '{"category": "fire_safety", "powerbi_field": "fire_extinguishers", "auto_generated": true}'::jsonb
  )
  RETURNING id INTO v_finding_id;

  -- Create a corrective action for the finding
  INSERT INTO corrective_actions (organization_id, finding_id, inspection_id, title, description, status, priority, assigned_to, assigned_by, due_date)
  VALUES (
    p_organization_id, v_finding_id, v_inspection_id,
    'Schedule Fire Extinguisher Service',
    'Contact certified fire safety vendor to inspect and service all overdue fire extinguishers in the facility.',
    'pending', 'high',
    p_user_id, p_user_id,
    CURRENT_DATE + INTERVAL '7 days'
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
