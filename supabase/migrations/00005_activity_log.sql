-- =============================================================
-- TaskFlow — Migration: 00005_activity_log
-- Adds the task_activity_log table for tracking audit history.
-- =============================================================

CREATE TABLE task_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tal_task_id    ON task_activity_log (task_id);
CREATE INDEX idx_tal_project_id ON task_activity_log (project_id);
CREATE INDEX idx_tal_created_at ON task_activity_log (created_at DESC);

-- Enable RLS
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone who is a member of the project (or owner) can view logs
CREATE POLICY "tal_select"
  ON task_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = task_activity_log.project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = task_activity_log.project_id
        AND user_id = auth.uid()
    )
  );

-- Insert policy: Members/owners can insert via server actions (or we can just use admin client on the server).
-- We'll just allow inserts if they have project access.
CREATE POLICY "tal_insert"
  ON task_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = task_activity_log.project_id
        AND user_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies. Log is append-only.

-- Apply default privileges to API roles just in case
GRANT ALL ON TABLE task_activity_log TO anon, authenticated, service_role;
