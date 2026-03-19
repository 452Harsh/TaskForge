import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "./components/logout-button";
import { CheckSquare } from "lucide-react";
import { SidebarNav } from "./components/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get projects where user is owner OR member
  const { data: ownedProjects } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id);

  const { data: memberProjectsData } = await supabase
    .from("project_members")
    .select("projects(*)")
    .eq("user_id", user.id);

  const memberProjects: Record<string, unknown>[] = (memberProjectsData || [])
    .map((pm: Record<string, unknown>) => pm.projects)
    .flat()
    .filter(Boolean) as Record<string, unknown>[];

  // Invited projects = member but NOT owner
  const invitedProjects: Record<string, unknown>[] = memberProjects.filter(
    (p) => (p as { owner_id: string }).owner_id !== user.id
  );

  // Owned projects from the direct query
  const myProjects = (ownedProjects || []).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const sharedProjects = invitedProjects.sort(
    (a, b) =>
      new Date((b as { created_at: string }).created_at).getTime() -
      new Date((a as { created_at: string }).created_at).getTime()
  ) as { id: string; name: string; created_at: string }[];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex-col bg-slate-900 text-slate-50 flex shrink-0">
        <div className="h-14 flex items-center px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-white">
              <CheckSquare className="h-5 w-5" />
            </div>
            TaskFlow
          </Link>
        </div>

        <SidebarNav myProjects={myProjects} sharedProjects={sharedProjects} />

        <div className="mt-auto border-t border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 border border-slate-700 bg-slate-800">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-slate-800 text-slate-300">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-sm">
              <span className="truncate font-medium text-slate-200">
                {profile?.full_name || "User"}
              </span>
              <span className="truncate text-xs text-slate-500">
                {user.email}
              </span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
