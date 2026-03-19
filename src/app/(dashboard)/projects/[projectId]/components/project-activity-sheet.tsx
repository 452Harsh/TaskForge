"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity, MessageSquare, CheckCircle, Tag, Edit, UserPlus, Clock } from "lucide-react";
import { getProjectActivity } from "@/lib/actions/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ProjectActivityLog = {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  tasks: {
    title: string;
  } | null;
};

export function ProjectActivitySheet({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<ProjectActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      const { data } = await getProjectActivity(projectId);
      if (data) {
        setLogs(data as ProjectActivityLog[]);
      }
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "assigned": return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "status_changed": return <Activity className="h-4 w-4 text-indigo-500" />;
      case "comment_added": return <MessageSquare className="h-4 w-4 text-slate-500" />;
      case "tags_updated": return <Tag className="h-4 w-4 text-fuchsia-500" />;
      case "due_date_changed": return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Edit className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatActionMessage = (log: ProjectActivityLog) => {
    switch (log.action) {
      case "created":
        return `created the task.`;
      case "assigned":
        return `assigned task to user.`;
      case "status_changed":
        return `changed status to ${log.new_value?.replace('_', ' ') || 'unknown'}.`;
      case "comment_added":
        return `added a comment.`;
      case "tags_updated":
        return `updated tags (${log.new_value}).`;
      case "metadata_updated":
        return `updated a custom field to ${log.new_value}.`;
      case "priority_changed":
        return `changed priority to ${log.new_value}.`;
      case "title_edited":
        return `edited the title.`;
      case "description_edited":
        return `edited the description.`;
      case "due_date_changed":
        return `changed due date to ${log.new_value}.`;
      default:
        return `performed action: ${log.action}.`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-[13px] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900 h-8 px-3 gap-2 shrink-0 shadow-sm text-zinc-700">
        <Activity className="h-4 w-4 text-zinc-500" />
        <span className="hidden sm:inline">Activity Log</span>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto border-l-zinc-200 shadow-2xl p-0">
        <SheetHeader className="px-6 py-6 border-b border-zinc-100 bg-zinc-50/50 sticky top-0 z-20 backdrop-blur-md">
          <SheetTitle className="text-lg font-semibold tracking-tight text-zinc-900">Project Activity</SheetTitle>
          <SheetDescription className="text-[13px] text-zinc-500">
            A chronological ledger of all changes occurring within this project.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-4">

        {loading ? (
          <div className="flex justify-center p-8">
            <span className="text-sm text-zinc-400 font-medium">Loading activity...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center p-8 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 mt-4">
            <span className="text-sm text-zinc-500 font-medium">No activity recorded yet.</span>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px before:h-full before:w-[1px] before:bg-zinc-200 pt-2">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-start gap-4 group transition-opacity hover:opacity-100 opacity-90">
                {/* Icon Node */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white relative z-10 shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 shadow-sm text-zinc-600 transition-transform group-hover:scale-110 duration-300">
                    {getActionIcon(log.action)}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 flex flex-col pt-2 pb-1 gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full">
                    <p className="text-[13px] text-zinc-600 leading-tight">
                      <span className="font-semibold text-zinc-900 mr-1.5">
                        {log.profiles?.full_name || "Unknown"}
                      </span>
                      {formatActionMessage(log)}
                    </p>
                    <time className="shrink-0 text-[11px] text-zinc-400 font-medium">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </time>
                  </div>
                  <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wide bg-zinc-100 max-w-max px-2 py-0.5 rounded-md mt-1">
                    {log.tasks?.title || "Unknown Task"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
