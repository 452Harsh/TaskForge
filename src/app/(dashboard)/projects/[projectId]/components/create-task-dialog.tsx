"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTask } from "@/lib/actions/tasks";
import { bulkSetTaskMetadata } from "@/lib/actions/metadata";
import { setTaskTags } from "@/lib/actions/tags";

type Member = {
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
};

type MetadataField = {
  id: string;
  field_name: string;
  possible_values: string[];
  default_value: string;
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

export function CreateTaskDialog({
  projectId,
  members,
  metadataFields = [],
  projectTags = [],
}: {
  projectId: string;
  members: Member[];
  metadataFields?: MetadataField[];
  projectTags?: Tag[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createTask(projectId, formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    // Save metadata values if task was created and we have the taskId
    if (result.taskId) {
      // Set metadata values
      const metaEntries = Object.entries(metadataValues)
        .filter(([, v]) => v && v !== "Not Applicable")
        .map(([fieldId, value]) => ({ field_id: fieldId, value }));
      
      if (metaEntries.length > 0) {
        await bulkSetTaskMetadata(result.taskId, projectId, metaEntries);
      }

      // Set tags
      if (selectedTags.length > 0) {
        await setTaskTags(result.taskId, projectId, selectedTags);
      }
    }

    setLoading(false);
    toast.success("Task created successfully");
    setOpen(false);
    setMetadataValues({});
    setSelectedTags([]);
    router.refresh();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create new task</DialogTitle>
          <DialogDescription>
            Add details for the new task and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Fix login bug" required autoFocus />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed steps to reproduce..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="todo"
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="medium"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee</Label>
                <select
                  id="assignee"
                  name="assignee"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profiles?.full_name || "Unknown user"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {/* ══ Custom Metadata Fields ══ */}
            {metadataFields.length > 0 && (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">
                  Custom Fields
                </Label>
                {metadataFields.map((field) => (
                  <div key={field.id} className="grid gap-1.5">
                    <Label className="text-sm">{field.field_name}</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={metadataValues[field.id] || field.default_value}
                      onChange={(e) =>
                        setMetadataValues((prev) => ({
                          ...prev,
                          [field.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="Not Applicable">Not Applicable</option>
                      {field.possible_values.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* ══ Tags ══ */}
            {projectTags.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {projectTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                          isSelected
                            ? "text-white border-transparent"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: tag.color }
                            : undefined
                        }
                      >
                        {!isSelected && (
                          <span
                            className="w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: tag.color }}
                          />
                        )}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
