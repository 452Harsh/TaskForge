-- =============================================================
-- TaskFlow — Supabase SQL Schema
-- Migration: 00001_initial_schema
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Custom ENUM types
-- ─────────────────────────────────────────────────────────────

CREATE TYPE project_role  AS ENUM ('manager', 'member');
CREATE TYPE task_status   AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- ─────────────────────────────────────────────────────────────
-- 2. Tables
-- ─────────────────────────────────────────────────────────────

-- 2a. profiles
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2b. projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2c. project_members (join table — composite PK)
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  role       project_role NOT NULL DEFAULT 'member',
  PRIMARY KEY (project_id, user_id)
);

-- 2d. tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  status      task_status   NOT NULL DEFAULT 'todo',
  priority    task_priority NOT NULL DEFAULT 'medium',
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2e. comments
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX idx_tasks_project_id  ON tasks (project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks (assignee_id);
CREATE INDEX idx_comments_task_id  ON comments (task_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Auto-create profile on sign-up (trigger)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 5. Auto-update updated_at on tasks
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 6. Row-Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments        ENABLE ROW LEVEL SECURITY;

-- ── profiles ────────────────────────────────────────────────

-- Any authenticated user can read all profiles
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── projects ────────────────────────────────────────────────

-- Authenticated users can read all projects
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create a project
CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Only the owner can update / delete
CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_delete"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ── project_members ─────────────────────────────────────────

CREATE POLICY "project_members_select"
  ON project_members FOR SELECT
  TO authenticated
  USING (true);

-- Only the project owner or a manager can add / remove members
CREATE POLICY "project_members_insert"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'manager'
    )
  );

CREATE POLICY "project_members_delete"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'manager'
    )
  );

-- ── tasks ───────────────────────────────────────────────────

CREATE POLICY "tasks_select"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- Project members can create tasks
CREATE POLICY "tasks_insert"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id AND owner_id = auth.uid()
    )
  );

-- Assignee, project owner, or managers can update tasks
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
        AND role = 'manager'
    )
  );

-- Project owner or managers can delete tasks
CREATE POLICY "tasks_delete"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = tasks.project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = tasks.project_id
        AND user_id = auth.uid()
        AND role = 'manager'
    )
  );

-- ── comments ────────────────────────────────────────────────

CREATE POLICY "comments_select"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

-- Any project member can comment
CREATE POLICY "comments_insert"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = task_id AND pm.user_id = auth.uid()
    )
  );

-- Only the comment author can update their comment
CREATE POLICY "comments_update"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Comment author or project owner can delete
CREATE POLICY "comments_delete"
  ON comments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_id AND p.owner_id = auth.uid()
    )
  );
