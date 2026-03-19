"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

// ── Fetch all metadata fields for a project ────────────────
export async function getMetadataFields(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_metadata_fields")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message, data: [] };
  return { data: data || [] };
}

// ── Create a metadata field ────────────────────────────────
export async function createMetadataField(
  projectId: string,
  fieldName: string,
  possibleValues: string[],
  defaultValue: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("project_metadata_fields")
    .insert({
      project_id: projectId,
      field_name: fieldName,
      possible_values: possibleValues,
      default_value: defaultValue || "Not Applicable",
    });

  if (error) {
    console.error("Error creating metadata field:", error);
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ── Delete a metadata field ────────────────────────────────
export async function deleteMetadataField(fieldId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("project_metadata_fields")
    .delete()
    .eq("id", fieldId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ── Set a metadata value on a task ─────────────────────────
export async function setTaskMetadata(
  taskId: string,
  projectId: string,
  fieldId: string,
  value: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("task_metadata_values")
    .upsert(
      { task_id: taskId, field_id: fieldId, value },
      { onConflict: "task_id,field_id" }
    );

  if (error) return { error: error.message };

  await logActivity(taskId, projectId, user.id, "metadata_updated", null, value);

  revalidatePath(`/projects/${projectId}/tasks/${taskId}`);
  return { success: true };
}

// ── Bulk-set metadata values when creating a task ──────────
export async function bulkSetTaskMetadata(
  taskId: string,
  projectId: string,
  values: { field_id: string; value: string }[]
) {
  if (!values.length) return { success: true };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const rows = values.map((v) => ({
    task_id: taskId,
    field_id: v.field_id,
    value: v.value,
  }));

  const { error } = await admin
    .from("task_metadata_values")
    .upsert(rows, { onConflict: "task_id,field_id" });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
