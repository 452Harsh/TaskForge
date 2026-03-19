"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "@/lib/actions/tasks";
import { addComment } from "@/lib/actions/comments";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User2, Ghost, GripVertical } from "lucide-react";

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
  assignee: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  task_tags?: { tag_id: string }[];
  task_metadata_values?: { field_id: string; value: string }[];
};

type ProjectTag = {
  id: string;
  name: string;
  color: string;
};

type MetadataField = {
  id: string;
  field_name: string;
};

export function KanbanBoard({
  projectId,
  initialTasks,
  canEditState,
  isOwner,
  projectTags = [],
  metadataFields = [],
}: {
  projectId: string;
  initialTasks: TaskData[];
  canEditState: boolean;
  isOwner: boolean;
  projectTags?: ProjectTag[];
  metadataFields?: MetadataField[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  
  // Dialog state for Done status
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [completing, setCompleting] = useState(false);
  const [pendingTask, setPendingTask] = useState<string | null>(null);

  const columns = [
    { title: "Todo", status: "todo" },
    { title: "In Progress", status: "in_progress" },
    { title: "In Review", status: "in_review" },
    { title: "Done", status: "done" },
  ];

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-rose-500";
      case "medium":
        return "border-l-amber-500";
      case "low":
        return "border-l-blue-500";
      default:
        return "border-l-slate-300";
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    // Check if user has permission to move the task
    if (!canEditState) {
      e.preventDefault();
      toast.error("You don't have permission to move this task.");
      return;
    }
    e.dataTransfer.setData("taskId", taskId);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    if (!canEditState) {
      toast.error("You don't have permission to move this task.");
      return;
    }

    if (targetStatus === "done" && !isOwner) {
      toast.error("Only the project owner can mark tasks as Done.");
      return;
    }

    if (targetStatus === "in_review" && !isOwner) {
      // Prompt assignee for a message before updating to review
      setPendingTask(taskId);
      setCompleteOpen(true);
      return;
    }

    await performStatusUpdate(taskId, targetStatus);
  };

  const performStatusUpdate = async (taskId: string, targetStatus: string, message?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    const result = await updateTask(taskId, projectId, { status: targetStatus });
    if (result.error) {
      toast.error("Failed to update task status");
      // Revert if error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
    } else if (message) {
      const finalMessage = `**Task submitted for review:**\n${message.trim()}`;
      await addComment(taskId, projectId, finalMessage);
      toast.success("Task submitted for review and message sent!");
    }
  };

  const handleCompleteTask = async () => {
    if (!pendingTask) return;
    setCompleting(true);
    await performStatusUpdate(pendingTask, "in_review", completionMessage || "Please review my changes.");
    setCompleting(false);
    setCompleteOpen(false);
    setCompletionMessage("");
    setPendingTask(null);
  };

  return (
    <>
      <Dialog open={completeOpen} onOpenChange={(open) => {
        if (!open && !completing) {
          setCompleteOpen(false);
          setPendingTask(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Review</DialogTitle>
            <DialogDescription>
              You&apos;re moving this task to Review. Leave a quick message for the project owner so they know what to check.
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
            <Button variant="outline" onClick={() => {
              setCompleteOpen(false);
              setPendingTask(null);
            }} disabled={completing}>
              Cancel
            </Button>
            <Button onClick={handleCompleteTask} disabled={completing}>
              {completing ? "Submitting..." : "Submit to Owner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        return (
          <div
            key={column.status}
            className="flex flex-col rounded-xl bg-slate-50 p-4 border border-slate-200 transition-colors hover:bg-slate-100/50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-semibold text-slate-900">{column.title}</h3>
              <span className="inline-flex items-center justify-center bg-slate-200 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-full min-w-6">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1 min-h-[150px]">
              {columnTasks.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 py-10 text-center text-sm text-slate-500 bg-white/50 flex flex-col items-center justify-center mt-2 pointer-events-none">
                  <Ghost className="h-8 w-8 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900 mb-1">No tasks here</p>
                  <p className="text-xs">Drop a task to move it.</p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  return (
                    <div
                      key={task.id}
                      draggable={canEditState}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        // Avoid navigating if we are dragging
                        if (e.defaultPrevented) return;
                        router.push(`/projects/${projectId}/tasks/${task.id}`);
                      }}
                      className="cursor-pointer block"
                    >
                        <Card className={`group shadow-sm transition-all duration-200 ease-in-out border-slate-200 border-l-[3px] ${getPriorityBorderColor(task.priority)} bg-white hover:shadow-md hover:-translate-y-0.5 ${canEditState ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                          <CardHeader className="p-4 pb-2 relative">
                            {canEditState && (
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="h-4 w-4 text-slate-300 pointer-events-none" />
                              </div>
                            )}
                            <div className="flex justify-between items-start gap-2 pr-4">
                              <CardTitle className="text-sm font-medium leading-snug text-slate-900">
                                {task.title}
                              </CardTitle>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider h-5 flex-shrink-0 ring-1 ring-inset ${getPriorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            {task.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                {task.description.replace(/<[^>]*>/g, '')}
                              </p>
                            )}
                            {/* Tags */}
                            {task.task_tags && task.task_tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {task.task_tags.map((tt) => {
                                  const tag = projectTags.find((t) => t.id === tt.tag_id);
                                  if (!tag) return null;
                                  return (
                                    <span
                                      key={tag.id}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium text-white"
                                      style={{ backgroundColor: tag.color }}
                                    >
                                      {tag.name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Metadata Fields */}
                            {task.task_metadata_values && task.task_metadata_values.length > 0 && metadataFields.length > 0 && (
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                                {task.task_metadata_values.filter(v => v.value !== "Not Applicable").map((mv) => {
                                  const field = metadataFields.find((f) => f.id === mv.field_id);
                                  if (!field) return null;
                                  return (
                                    <div key={field.id} className="flex items-center gap-1 text-[10px] text-slate-500">
                                      <span className="font-semibold text-slate-700">{field.field_name}:</span>
                                      <span>{mv.value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                              <div className={`flex items-center gap-1.5 text-xs font-medium ${task.due_date && new Date(task.due_date) < new Date()
                                ? "text-rose-600" : "text-slate-500"}`}>
                                <Calendar className="h-3.5 w-3.5" />
                                {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US") : "No date"}
                              </div>
                              <Avatar className="h-6 w-6 border-slate-200 bg-slate-100">
                                <AvatarImage src={task.assignee?.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] text-slate-600">
                                  {task.assignee?.full_name?.charAt(0) || <User2 className="h-3 w-3" />}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </CardContent>
                        </Card>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}
