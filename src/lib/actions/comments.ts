"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { error } = await supabase.from("comments").insert({
    task_id: taskId,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) {
    console.error("Error adding comment:", error);
    return { error: error.message };
  }

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
