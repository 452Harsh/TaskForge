import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TaskDetailClient } from "./components/task-detail-client";
import { CommentData } from "@/components/comments/comment-section";

export default async function TaskPage({
  params,
}: {
  params: { projectId: string; taskId: string };
}) {
  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", params.taskId)
    .eq("project_id", params.projectId)
    .single();

  if (taskError || !task) {
    notFound();
  }

  // Fetch project to get owner_id
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", params.projectId)
    .single();

  const ownerId = project?.owner_id ?? "";

  // Fetch ALL profiles so any user can be assigned
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .not("full_name", "is", null)
    .order("full_name", { ascending: true });

  const members = (profilesData || []).map((p) => ({
    user_id: p.id,
    profiles: { full_name: p.full_name as string | null },
  }));

  // Fetch comments
  const { data: commentsData } = await supabase
    .from("comments")
    .select("*, profiles(full_name, avatar_url)")
    .eq("task_id", params.taskId)
    .order("created_at", { ascending: false });

  const comments = (commentsData || []) as unknown as CommentData[];

  // Fetch metadata fields for this project
  const { data: metadataFields } = await supabase
    .from("project_metadata_fields")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: true });

  // Fetch metadata values for this task
  const { data: metadataValues } = await supabase
    .from("task_metadata_values")
    .select("*")
    .eq("task_id", params.taskId);

  // Fetch tags for this project
  const { data: projectTags } = await supabase
    .from("project_tags")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: true });

  // Fetch tags assigned to this task
  const { data: taskTags } = await supabase
    .from("task_tags")
    .select("tag_id")
    .eq("task_id", params.taskId);

  // Check if current user is a project member
  const { data: membershipData } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", params.projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isMember = !!membershipData || user.id === ownerId;

  // Fetch Activity Log
  const { getTaskActivity } = await import("@/lib/actions/activity");
  const { data: activityLogs } = await getTaskActivity(params.taskId);

  return (
    <TaskDetailClient
      task={task}
      projectId={params.projectId}
      members={members}
      comments={comments}
      currentUserId={user.id}
      ownerId={ownerId}
      metadataFields={metadataFields || []}
      metadataValues={metadataValues || []}
      projectTags={projectTags || []}
      taskTagIds={(taskTags || []).map((t) => t.tag_id)}
      isMember={isMember}
      activityLogs={activityLogs || []}
    />
  );
}
