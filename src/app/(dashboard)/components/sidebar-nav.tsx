"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
};

// Simple stable color generator based on project ID
const getDotColor = (id: string) => {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", 
    "bg-green-500", "bg-emerald-500", "bg-teal-500", 
    "bg-cyan-500", "bg-blue-500", "bg-indigo-500", 
    "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", 
    "bg-pink-500", "bg-rose-500"
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function SidebarNav({
  myProjects,
  sharedProjects,
}: {
  myProjects: Project[];
  sharedProjects: Project[];
}) {
  const pathname = usePathname();

  return (
    <div className="flex-1 overflow-auto py-4 flex flex-col gap-6">
      <nav className="grid gap-1 px-3 text-sm font-medium">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 transition-all hover:bg-slate-800",
            pathname === "/" ? "bg-slate-800 text-white" : "text-slate-400"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </nav>

      {/* YOUR PROJECTS */}
      <div>
        <h4 className="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Your Projects
        </h4>
        <nav className="grid gap-1 px-3 text-sm font-medium">
          {myProjects.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">No projects yet.</p>
          ) : (
            myProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-all hover:bg-slate-800 hover:text-white",
                  pathname === `/projects/${project.id}` || pathname.startsWith(`/projects/${project.id}/`)
                    ? "bg-slate-800 text-white"
                    : "text-slate-400"
                )}
              >
                <div className={cn("h-2 w-2 rounded-full", getDotColor(project.id))} />
                <span className="truncate">{project.name}</span>
              </Link>
            ))
          )}
        </nav>
      </div>

      {/* INVITED PROJECTS */}
      {sharedProjects.length > 0 && (
        <div>
          <h4 className="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Invited Projects
          </h4>
          <nav className="grid gap-1 px-3 text-sm font-medium">
            {sharedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-all hover:bg-slate-800 hover:text-white",
                  pathname === `/projects/${project.id}` || pathname.startsWith(`/projects/${project.id}/`)
                    ? "bg-slate-800 text-white"
                    : "text-slate-400"
                )}
              >
                <Users className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
