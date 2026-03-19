"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTask, deleteTask } from "@/lib/actions/tasks";
import { addComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CommentSection, CommentData } from "@/components/comments/comment-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
};

type MemberData = {
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
};

export function TaskDetailClient({
  task,
  projectId,
  members,
  comments,
  currentUserId,
  ownerId,
}: {
  task: TaskData;
  projectId: string;
  members: MemberData[];
  comments: CommentData[];
  currentUserId: string;
  ownerId: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Local state for inline edits
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || "");
  const [dueDate, setDueDate] = useState(task.due_date || "");

  // Completion Dialog State
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [completing, setCompleting] = useState(false);

  const handleUpdate = async (field: string, value: string | null) => {
    const result = await updateTask(task.id as string, projectId, { [field]: value });

    if (result.error) {
      toast.error(`Failed to update ${field}: ${result.error}`);
    } else {
      toast.success("Task updated");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteTask(task.id, projectId);
    setDeleting(false);

    if (result.error) {
      toast.error(`Failed to delete: ${result.error}`);
      setDeleteOpen(false);
    } else {
      toast.success("Task deleted");
      router.push(`/projects/${projectId}`);
    }
  };

  const isOwner = currentUserId === ownerId;
  const isMember = members.some((m) => m.user_id === currentUserId);
  const canEditState = isOwner || isMember;

  const handleStatusChange = (newStatus: string) => {
    // Prevent non-owners from setting to done (just in case)
    if (newStatus === "done" && !isOwner) {
      toast.error("Only the project owner can mark tasks as Done.");
      return;
    }

    if (newStatus === "in_review" && !isOwner) {
      // Prompt assignee for a message before updating to review
      setCompleteOpen(true);
      return;
    }
    
    // Otherwise update immediately
    setStatus(newStatus);
    handleUpdate("status", newStatus);
  };

  const handleCompleteTask = async () => {
    setCompleting(true);
    
    // First update the status
    const statusResult = await updateTask(task.id, projectId, { status: "done" });
    
    if (statusResult.error) {
      toast.error(`Failed to update status: ${statusResult.error}`);
      setCompleting(false);
      return;
    }

    // Then add the comment if provided
    if (completionMessage.trim()) {
      const finalMessage = `**Task marked as done:**\n${completionMessage.trim()}`;
      await addComment(task.id, projectId, finalMessage);
    } else {
      await addComment(task.id, projectId, "**Task marked as done**");
    }

    setStatus("done");
    toast.success("Task completed and message sent to owner!");
    setCompleting(false);
    setCompleteOpen(false);
    setCompletionMessage("");
  };

  // Helpers for Badges
  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      case "medium":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "low":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "todo":
        return "bg-slate-100 text-slate-700 ring-slate-500/20";
      case "in_progress":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "done":
        return "bg-green-50 text-green-700 ring-green-600/20";
      default:
        return "bg-slate-100 text-slate-700 ring-slate-500/20";
    }
  };

  const isOverdue = dueDate && new Date(dueDate) < new Date();

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1 -ml-3 text-muted-foreground">
          <Link href={`/projects/${projectId}`}>
            <ChevronLeft className="h-4 w-4" />
            Back to Board
          </Link>
        </Button>

        {isOwner && (
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2 shrink-0">
                <Trash2 className="h-4 w-4" />
                Delete Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete this task
                  and remove it from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete Permanently"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={completeOpen} onOpenChange={(open) => {
        if (!open && !completing) setCompleteOpen(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              You&apos;re marking this task as done. Leave a quick message for the project owner to let them know.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={completionMessage}
              onChange={(e) => setCompletionMessage(e.target.value)}
              placeholder="E.g. I have deployed the changes and tested them..."
              className="resize-none min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)} disabled={completing}>
              Cancel
            </Button>
            <Button onClick={handleCompleteTask} disabled={completing}>
              {completing ? "Submitting..." : "Submit to Owner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: TASK INFO */}
        <div className="md:col-span-2 space-y-8 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
          
          {/* Header Row: Title & Priority Badge */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Task Title
              </Label>
              <div className="flex items-center gap-2">
                {isOwner ? (
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      handleUpdate("priority", e.target.value);
                    }}
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ring-1 ring-inset cursor-pointer outline-none ${getPriorityColor(priority)}`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ring-1 ring-inset ${getPriorityColor(priority)}`}>
                    {priority}
                  </span>
                )}
              </div>
            </div>
            
            {isOwner ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={(e) => {
                  if (e.target.value !== task.title) {
                    handleUpdate("title", e.target.value);
                  }
                }}
                className="text-3xl font-bold h-auto py-2 px-3 -ml-3 border-transparent hover:border-slate-200 focus:border-slate-300 transition-colors shadow-none text-slate-900"
              />
            ) : (
              <p className="text-3xl font-bold py-2 text-slate-900">{title}</p>
            )}
          </div>

        {/* Description */}
        <div>
          <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3 block border-b border-slate-100 pb-2">
            Description
          </Label>
          {isOwner ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={(e) => {
                if (e.target.value !== (task.description || "")) {
                  handleUpdate("description", e.target.value);
                }
              }}
              placeholder="Add a more detailed description..."
              className="min-h-[120px] resize-y border-transparent hover:border-slate-200 focus:border-slate-300 shadow-none -ml-3 transition-colors bg-transparent text-slate-700"
            />
          ) : (
            <p className="text-sm text-slate-700 min-h-[60px] whitespace-pre-wrap leading-relaxed">
              {description || "No description provided."}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
          
          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Status
            </Label>
            <div className="flex">
              {canEditState ? (
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`flex h-8 items-center rounded-full px-3 text-xs font-medium capitalize ring-1 ring-inset outline-none cursor-pointer ${getStatusColor(status)}`}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done" disabled={!isOwner && status !== "done"}>Done</option>
                </select>
              ) : (
                <div className={`flex h-8 items-center rounded-full px-3 text-xs font-medium capitalize ring-1 ring-inset ${getStatusColor(status)}`}>
                  {status.replace("_", " ")}
                </div>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Assignee
            </Label>
            {canEditState ? (
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  handleUpdate("assignee_id", e.target.value || null);
                }}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-slate-700"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name || "Unknown user"}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-9 items-center px-3 rounded-lg border border-slate-100 bg-slate-50 text-sm font-medium text-slate-700">
                {members.find((m) => m.user_id === assigneeId)?.profiles?.full_name || "Unassigned"}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Due Date
            </Label>
            {isOwner ? (
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleUpdate("due_date", e.target.value || null);
                  }}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-slate-700"
                />
              </div>
            ) : (
              <div className={`flex h-9 items-center px-3 rounded-lg border text-sm font-medium ${isOverdue ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                {dueDate ? new Date(dueDate).toLocaleDateString("en-US") : "No due date"}
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* RIGHT COLUMN: COMMENTS */}
      <div className="md:col-span-1 flex flex-col h-full min-h-[400px]">
        <CommentSection 
          comments={comments} 
          currentUserId={currentUserId} 
          taskId={task.id} 
          projectId={projectId} 
        />
      </div>
    </div>
    </div>
  );
}
