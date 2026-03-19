"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(name: string, description: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Insert project
  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      name,
      description,
      owner_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Project Insert Error:", insertError);
    return { error: insertError.message };
  }

  // Add owner as a 'manager' in project_members
  const { error: memberError } = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "manager",
  });

  if (memberError) {
    console.error("Project Member Insert Error:", memberError);
    return { error: memberError.message };
  }

  revalidatePath("/");
  return { success: true, projectId: project.id };
}

export async function addProjectMember(projectId: string, userId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only the project owner can add members
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== user.id) {
    return { error: "Only the project owner can add members" };
  }

  const { error } = await supabase
    .from("project_members")
    .upsert(
      { project_id: projectId, user_id: userId, role: "member" },
      { onConflict: "project_id,user_id", ignoreDuplicates: true }
    );

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only the project owner can remove members
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== user.id) {
    return { error: "Only the project owner can remove members" };
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only the project owner can delete the project
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== user.id) {
    return { error: "Only the project owner can delete this project" };
  }

  // Delete project
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    console.error("Project Delete Error:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
