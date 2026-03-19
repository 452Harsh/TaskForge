import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

import { CreateTaskDialog } from "./components/create-task-dialog";
import { ManageMembersDialog } from "./components/manage-members-dialog";
import { DeleteProjectButton } from "./components/delete-project-button";
import { KanbanBoard } from "./components/kanban-board";
import { ProjectSettingsDialog } from "./components/project-settings-dialog";
import { ProjectActivitySheet } from "./components/project-activity-sheet";

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

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const isOwner = user.id === project.owner_id;

  // Fetch tasks for this project (with assignee + tags + metadata)
  let tasksQuery = supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles(full_name, avatar_url),
      task_tags(tag_id),
      task_metadata_values(field_id, value)
    `)
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: false });

  // ONLY the owner sees all tasks. Assignees see only their assigned tasks.
  if (!isOwner) {
    tasksQuery = tasksQuery.eq("assignee_id", user.id);
  }

  const { data: tasks, error: tasksError } = await tasksQuery;

  // Fetch current project members (for the dialog list)
  const { data: membersData } = await supabase
    .from("project_members")
    .select("user_id, role, profiles(full_name)")
    .eq("project_id", params.projectId);

  const currentMembers = (membersData || []) as unknown as {
    user_id: string;
    role: string;
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

  // Fetch metadata fields for this project
  const { data: metadataFields } = await supabase
    .from("project_metadata_fields")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: true });

  // Fetch tags for this project
  const { data: projectTags } = await supabase
    .from("project_tags")
    .select("*")
    .eq("project_id", params.projectId)
    .order("created_at", { ascending: true });

  const userMember = currentMembers.find((m) => m.user_id === user?.id);
  const isManager = userMember?.role === "manager";
  const canEdit = isOwner || !!userMember;
  const canManageSettings = isOwner || isManager;

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
          {canManageSettings && (
            <ProjectSettingsDialog
              projectId={project.id}
              metadataFields={metadataFields || []}
              tags={projectTags || []}
            />
          )}
          {isOwner && (
            <>
              <ProjectActivitySheet projectId={project.id} />
              <ManageMembersDialog
                projectId={project.id}
                ownerId={project.owner_id}
                currentMembers={currentMembers}
                allProfiles={allProfiles}
              />
              <CreateTaskDialog
                projectId={project.id}
                members={members}
                metadataFields={metadataFields || []}
                projectTags={projectTags || []}
              />
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
        projectTags={projectTags || []}
        metadataFields={metadataFields || []}
      />
    </div>
  );
}
