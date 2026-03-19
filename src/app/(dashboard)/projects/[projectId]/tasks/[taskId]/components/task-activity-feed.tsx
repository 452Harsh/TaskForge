"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Activity, MessageSquare, CheckCircle, Tag, Edit, UserPlus, Clock } from "lucide-react";

export type ActivityLogData = {
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
};

export function TaskActivityFeed({ logs }: { logs: ActivityLogData[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
        No activity yet.
      </div>
    );
  }

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

  const formatActionMessage = (log: ActivityLogData) => {
    switch (log.action) {
      case "created":
        return `created this task.`;
      case "assigned":
        return `assigned task to user.`;
      case "status_changed":
        return `changed status to ${log.new_value?.replace('_', ' ') || 'unknown'}.`;
      case "comment_added":
        return `added a comment.`;
      case "tags_updated":
        return `updated tags (${log.new_value}).`;
      case "metadata_updated":
        return `updated a custom field setting it to ${log.new_value}.`;
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
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[19px] md:before:mx-auto md:before:translate-x-0 before:-translate-x-px before:h-full before:w-[1px] before:bg-zinc-200 pt-2">
      {logs.map((log) => (
        <div key={log.id} className="relative flex items-start md:items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-opacity hover:opacity-100 opacity-90">
          
          {/* Icon Node */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white relative z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 shadow-sm text-zinc-600 transition-transform group-hover:scale-110 duration-300">
              {getActionIcon(log.action)}
            </div>
          </div>

          {/* Card */}
          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] flex items-start gap-3">
             <Avatar className="h-7 w-7 shrink-0 hidden md:block mt-0.5">
               <AvatarImage src={log.profiles?.avatar_url || ""} />
               <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-600 font-medium">
                 {log.profiles?.full_name?.charAt(0)?.toUpperCase() || "U"}
               </AvatarFallback>
             </Avatar>
             <div className="flex-1 flex flex-col pt-1">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full bg-transparent md:group-odd:flex-row-reverse md:group-even:flex-row">
                 <p className="text-[13px] text-zinc-600 leading-tight md:group-odd:text-right">
                   <span className="font-semibold text-zinc-900 mr-1.5 md:group-odd:ml-1.5 md:group-odd:mr-0 inline-block">
                     {log.profiles?.full_name || "Unknown"}
                   </span>
                   {formatActionMessage(log)}
                 </p>
                 <time className="shrink-0 text-[11px] text-zinc-400 font-medium md:group-odd:text-left">
                   {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                 </time>
               </div>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
