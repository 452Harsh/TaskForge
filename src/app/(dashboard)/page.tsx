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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your Projects</h1>
          <p className="text-zinc-500 text-[13px] mt-1 font-medium">
            Manage your teams and current projects.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white/50 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center p-8">
            <div className="h-16 w-16 bg-zinc-100 text-zinc-400 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 shadow-inner">
              <LayoutDashboard className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">No projects found</h3>
            <p className="mb-8 mt-2 text-[13px] text-zinc-500 leading-relaxed font-medium">
              You haven&apos;t created or joined any projects yet. Start by creating your first project to organize tasks and collaborate.
            </p>
            <CreateProjectDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block group">
              <Card className="h-full bg-white border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-hover:border-zinc-300 rounded-xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-[17px] font-bold text-zinc-900 group-hover:text-black transition-colors tracking-tight">
                      {project.name}
                    </CardTitle>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Active
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[40px] text-[13px] text-zinc-500 mt-2 font-medium leading-relaxed">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-[12px] text-zinc-500">
                    <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100 font-semibold group-hover:bg-zinc-100 transition-colors">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      <span>
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
