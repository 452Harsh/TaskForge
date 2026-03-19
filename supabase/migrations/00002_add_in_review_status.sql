-- =============================================================
-- TaskFlow — Migration: 00002_add_in_review_status
-- Adds 'in_review' to the task_status enum
-- Updates the tasks_update RLS policy to allow all members
-- =============================================================

-- 1. Add 'in_review' to the task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'in_review';

-- 2. Update tasks_update RLS policy to allow ANY project member
--    (not just managers) to update tasks
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

-- 3. Update comments_insert RLS to allow owner to comment too
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
