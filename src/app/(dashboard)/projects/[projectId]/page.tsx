import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import { CreateTaskDialog } from "./components/create-task-dialog";
import { ManageMembersDialog } from "./components/manage-members-dialog";
import { DeleteProjectButton } from "./components/delete-project-button";
import { KanbanBoard } from "./components/kanban-board";

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = await createClient();

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch tasks for this project
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles(full_name, avatar_url)
    `)
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: false });

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch current project members (for the dialog list)
  const { data: membersData } = await supabase
    .from("project_members")
    .select("user_id, profiles(full_name)")
    .eq("project_id", params.projectId);

  const currentMembers = (membersData || []) as unknown as {
    user_id: string;
    profiles: { full_name: string | null } | null;
  }[];

  // Fetch all profiles for the Create Task assignee dropdown AND the add-members list
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .not("full_name", "is", null)
    .order("full_name", { ascending: true });

  const allProfiles = profilesData || [];

  // Shape members for CreateTaskDialog
  const members = allProfiles.map((p) => ({
    user_id: p.id,
    profiles: { full_name: p.full_name },
  }));

  const isOwner = user?.id === project.owner_id;
  const canEdit = isOwner || currentMembers.some((m) => m.user_id === user?.id);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-2">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user?.id === project.owner_id && (
            <>
              <ManageMembersDialog
                projectId={project.id}
                ownerId={project.owner_id}
                currentMembers={currentMembers}
                allProfiles={allProfiles}
              />
              <CreateTaskDialog projectId={project.id} members={members} />
              <DeleteProjectButton projectId={project.id} />
            </>
          )}
        </div>
      </div>

      {tasksError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          <strong>Database Error:</strong> {tasksError.message}
          <p className="text-sm mt-1">{tasksError.hint || tasksError.details}</p>
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard 
        projectId={project.id} 
        initialTasks={tasks || []} 
        canEditState={canEdit}
        isOwner={isOwner}
      />
    </div>
  );
}
