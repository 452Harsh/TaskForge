-- =============================================================
-- TaskFlow — Migration: 00004_fix_grants
-- Grants permissions to the new tables created in 00003.
-- =============================================================

GRANT ALL ON TABLE project_metadata_fields TO anon, authenticated, service_role;
GRANT ALL ON TABLE task_metadata_values TO anon, authenticated, service_role;
GRANT ALL ON TABLE project_tags TO anon, authenticated, service_role;
GRANT ALL ON TABLE task_tags TO anon, authenticated, service_role;
