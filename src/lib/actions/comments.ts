"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

export async function addComment(
  taskId: string,
  projectId: string,
  content: string
) {
  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (!content.trim()) {
    return { error: "Comment cannot be empty" };
  }

  // Use admin client to bypass RLS
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.from("comments").insert({
    task_id: taskId,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) {
    console.error("Error adding comment:", error);
    return { error: error.message };
  }

  await logActivity(taskId, projectId, user.id, "comment_added", null, content.trim());

  revalidatePath(`/projects/${projectId}/tasks/${taskId}`);
  return { success: true };
}

export async function deleteComment(
  commentId: string,
  taskId: string,
  projectId: string
) {
  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Deleting the comment where user_id must match the authenticated user
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting comment:", error);
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}/tasks/${taskId}`);
  return { success: true };
}
