"use server";

import { createAdminClient } from "../supabase/admin";

export async function logActivity(
  taskId: string,
  projectId: string,
  userId: string,
  action: string,
  oldValue: string | null = null,
  newValue: string | null = null
) {
  const supabaseAdmin = createAdminClient();

  // We use the admin client to ensure logs are written successfully regardless of RLS,
  // although RLS technically allows members to insert. It's safer for background/internal logging.
  const { error } = await supabaseAdmin.from("task_activity_log").insert([
    {
      task_id: taskId,
      project_id: projectId,
      user_id: userId,
      action,
      old_value: oldValue,
      new_value: newValue,
    },
  ]);

  if (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getTaskActivity(taskId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("task_activity_log")
    .select(`
      *,
      profiles(full_name, avatar_url)
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch task activity:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getProjectActivity(projectId: string) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("task_activity_log")
    .select(`
      *,
      profiles(full_name, avatar_url),
      tasks(title)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch project activity:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
