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

  // Fetch ALL profiles so any user can be assigned — they will be auto-added
  // to project_members by the Server Action if they aren't already a member.
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .not("full_name", "is", null)
    .order("full_name", { ascending: true });

  const members = (profilesData || []).map((p) => ({
    user_id: p.id,
    profiles: { full_name: p.full_name as string | null},
  }));

  // Fetch comments
  const { data: commentsData } = await supabase
    .from("comments")
    .select("*, profiles(full_name, avatar_url)")
    .eq("task_id", params.taskId)
    .order("created_at", { ascending: false });

  const comments = (commentsData || []) as unknown as CommentData[];

  return (
    <TaskDetailClient 
      task={task} 
      projectId={params.projectId} 
      members={members}
      comments={comments}
      currentUserId={user.id}
      ownerId={ownerId}
    />
  );
}
