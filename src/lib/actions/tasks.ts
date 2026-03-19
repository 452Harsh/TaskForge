"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTask(projectId: string, formData: FormData) {
  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const priority = formData.get("priority") as string;
  const assignee_id = formData.get("assignee") as string;
  const due_date = formData.get("due_date") as string;

  if (!title) {
    return { error: "Title is required" };
  }

  // Insert task
  const { error } = await supabase.from("tasks").insert({
    title,
    description: description || null,
    status: status || "todo",
    priority: priority || "medium",
    project_id: projectId,
    assignee_id: assignee_id || null,
    due_date: due_date || null,
  });

  if (error) {
    console.error("Error creating task:", error);
    return { error: error.message };
  }

  // If a specific user was assigned, automatically add them as a project member
  // so they can see the project and task on their own dashboard.
  if (assignee_id) {
    // upsert: insert only if (project_id, user_id) pair doesn't already exist
    const { error: memberError } = await supabase
      .from("project_members")
      .upsert(
        { project_id: projectId, user_id: assignee_id, role: "member" },
        { onConflict: "project_id,user_id", ignoreDuplicates: true }
      );

    if (memberError) {
      console.warn("Could not auto-add assignee as project member:", memberError.message);
      // Non-fatal — task was still created successfully
    }
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTask(taskId: string, projectId: string, data: Record<string, unknown>) {
  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) {
    console.error("Error updating task:", error);
    return { error: error.message };
  }

  // When reassigning to a new user, ensure they become a project member
  if (data.assignee_id && typeof data.assignee_id === "string") {
    await supabase
      .from("project_members")
      .upsert(
        { project_id: projectId, user_id: data.assignee_id, role: "member" },
        { onConflict: "project_id,user_id", ignoreDuplicates: true }
      );
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks/${taskId}`);
  return { success: true };
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) {
    console.error("Error deleting task:", error);
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
