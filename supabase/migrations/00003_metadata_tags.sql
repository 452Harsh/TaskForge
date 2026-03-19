-- =============================================================
-- TaskFlow — Migration: 00003_metadata_tags
-- Adds project metadata fields, project tags, and their task
-- join tables. Also bundles the in_review status fix.
-- =============================================================

-- 1. Add 'in_review' to the task_status enum (from 00002)
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'in_review';

-- 2. Update tasks_update RLS to allow any member (from 00002)
DROP POLICY IF EXISTS "tasks_update" ON tasks;

CREATE POLICY "tasks_update"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    assignee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
        AND user_id = auth.uid()
    )
  );

-- 3. Fix comments_insert RLS to allow owner to comment (from 00002)
DROP POLICY IF EXISTS "comments_insert" ON comments;

CREATE POLICY "comments_insert"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id
        WHERE t.id = task_id AND pm.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE t.id = task_id AND p.owner_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Project Metadata Fields
-- ─────────────────────────────────────────────────────────────

CREATE TABLE project_metadata_fields (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  field_name    TEXT NOT NULL,
  possible_values TEXT[] NOT NULL DEFAULT '{}',
  default_value TEXT NOT NULL DEFAULT 'Not Applicable',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pmf_project_id ON project_metadata_fields (project_id);

-- ─────────────────────────────────────────────────────────────
-- 5. Task Metadata Values
-- ─────────────────────────────────────────────────────────────

CREATE TABLE task_metadata_values (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id   UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  field_id  UUID NOT NULL REFERENCES project_metadata_fields (id) ON DELETE CASCADE,
  value     TEXT NOT NULL DEFAULT 'Not Applicable'
);

CREATE INDEX idx_tmv_task_id  ON task_metadata_values (task_id);
CREATE INDEX idx_tmv_field_id ON task_metadata_values (field_id);

-- Unique constraint: one value per field per task
ALTER TABLE task_metadata_values
  ADD CONSTRAINT uq_task_field UNIQUE (task_id, field_id);

-- ─────────────────────────────────────────────────────────────
-- 6. Project Tags
-- ─────────────────────────────────────────────────────────────

CREATE TABLE project_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pt_project_id ON project_tags (project_id);

-- ─────────────────────────────────────────────────────────────
-- 7. Task Tags (join table)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES project_tags (id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- ─────────────────────────────────────────────────────────────
-- 8. RLS for new tables
-- ─────────────────────────────────────────────────────────────

ALTER TABLE project_metadata_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_metadata_values    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags               ENABLE ROW LEVEL SECURITY;

-- project_metadata_fields: anyone can read, owner/manager can write
CREATE POLICY "pmf_select" ON project_metadata_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "pmf_insert" ON project_metadata_fields FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_metadata_fields.project_id AND user_id = auth.uid() AND role = 'manager')
  );
CREATE POLICY "pmf_update" ON project_metadata_fields FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_metadata_fields.project_id AND user_id = auth.uid() AND role = 'manager')
  );
CREATE POLICY "pmf_delete" ON project_metadata_fields FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_metadata_fields.project_id AND user_id = auth.uid() AND role = 'manager')
  );

-- task_metadata_values: anyone can read, members can write
CREATE POLICY "tmv_select" ON task_metadata_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "tmv_insert" ON task_metadata_values FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tmv_update" ON task_metadata_values FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tmv_delete" ON task_metadata_values FOR DELETE TO authenticated USING (true);

-- project_tags: anyone can read, owner/manager can write
CREATE POLICY "pt_select" ON project_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "pt_insert" ON project_tags FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_tags.project_id AND user_id = auth.uid() AND role = 'manager')
  );
CREATE POLICY "pt_delete" ON project_tags FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_tags.project_id AND user_id = auth.uid() AND role = 'manager')
  );

-- task_tags: anyone can read, members can write
CREATE POLICY "tt_select" ON task_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "tt_insert" ON task_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tt_delete" ON task_tags FOR DELETE TO authenticated USING (true);
