"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

// ── Fetch all tags for a project ───────────────────────────
export async function getProjectTags(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_tags")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message, data: [] };
  return { data: data || [] };
}

// ── Create a tag ───────────────────────────────────────────
export async function createTag(
  projectId: string,
  name: string,
  color: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("project_tags")
    .insert({
      project_id: projectId,
      name,
      color: color || "#6366f1",
    });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ── Delete a tag ───────────────────────────────────────────
export async function deleteTag(tagId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("project_tags")
    .delete()
    .eq("id", tagId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ── Set tags on a task (replace all) ───────────────────────
export async function setTaskTags(
  taskId: string,
  projectId: string,
  tagIds: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  // Remove existing tags
  await admin.from("task_tags").delete().eq("task_id", taskId);

  // Insert new ones
  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId }));
    const { error } = await admin.from("task_tags").insert(rows);
    if (error) return { error: error.message };
  }

  await logActivity(taskId, projectId, user.id, "tags_updated", null, `${tagIds.length} tags`);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks/${taskId}`);
  return { success: true };
}
