import { createClient } from "@/lib/supabase/server";
import { CreateProjectDialog } from "./components/create-project-dialog";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // We need to fetch projects the user owns or is a member of.
  const { data: ownedProjects } = await supabase
    .from("projects")
    .select("*, project_members(user_id)")
    .eq("owner_id", user.id);

  const { data: memberProjectsData } = await supabase
    .from("project_members")
    .select("projects(*, project_members(user_id))")
    .eq("user_id", user.id);

  const memberProjects: Record<string, unknown>[] = (memberProjectsData || [])
    .map((pm: Record<string, unknown>) => pm.projects)
    .flat()
    .filter(Boolean) as Record<string, unknown>[];

  // Merge and deduplicate
  const allProjectsMap = new Map();
  ownedProjects?.forEach((p) => allProjectsMap.set(p.id, p));
  memberProjects?.forEach((p) => allProjectsMap.set(p.id, p));

  const projects = Array.from(allProjectsMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and current projects.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center p-8">
            <div className="h-20 w-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboard className="h-10 w-10" />
            </div>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">No projects found</h3>
            <p className="mb-6 mt-2 text-sm text-slate-500">
              You haven&apos;t created or joined any projects yet. Get started by creating your first project to organize tasks and collaborate with your team.
            </p>
            <CreateProjectDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block group">
              <Card className="h-full bg-white border-slate-200 shadow-sm transition-all duration-200 ease-in-out group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-slate-300 rounded-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {project.name}
                    </CardTitle>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                      Active
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[40px] text-sm text-slate-500 mt-2">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">
                        {project.project_members?.length || 1} Member
                        {(project.project_members?.length || 1) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
