"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Settings, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createMetadataField,
  deleteMetadataField,
} from "@/lib/actions/metadata";
import { createTag, deleteTag } from "@/lib/actions/tags";

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

const TAG_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
];

export function ProjectSettingsDialog({
  projectId,
  metadataFields,
  tags,
}: {
  projectId: string;
  metadataFields: MetadataField[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"fields" | "tags">("fields");

  // ── Metadata field form state ──
  const [fieldName, setFieldName] = useState("");
  const [fieldValues, setFieldValues] = useState("");
  const [fieldDefault, setFieldDefault] = useState("Not Applicable");
  const [addingField, setAddingField] = useState(false);

  // ── Tag form state ──
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [addingTag, setAddingTag] = useState(false);

  const handleAddField = async () => {
    if (!fieldName.trim()) {
      toast.error("Field name is required");
      return;
    }
    const values = fieldValues
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) {
      toast.error("At least one possible value is required");
      return;
    }

    setAddingField(true);
    const result = await createMetadataField(
      projectId,
      fieldName.trim(),
      values,
      fieldDefault.trim() || "Not Applicable"
    );
    setAddingField(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Field "${fieldName}" created`);
      setFieldName("");
      setFieldValues("");
      setFieldDefault("Not Applicable");
      router.refresh();
    }
  };

  const handleDeleteField = async (fieldId: string, name: string) => {
    const result = await deleteMetadataField(fieldId, projectId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Field "${name}" deleted`);
      router.refresh();
    }
  };

  const handleAddTag = async () => {
    if (!tagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    setAddingTag(true);
    const result = await createTag(projectId, tagName.trim(), tagColor);
    setAddingTag(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Tag "${tagName}" created`);
      setTagName("");
      router.refresh();
    }
  };

  const handleDeleteTag = async (tagId: string, name: string) => {
    const result = await deleteTag(tagId, projectId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Tag "${name}" deleted`);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Define custom fields and tags for tasks in this project.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
              tab === "fields"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setTab("fields")}
          >
            Custom Fields
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
              tab === "tags"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setTab("tags")}
          >
            Tags
          </button>
        </div>

        {/* ═══ Custom Fields Tab ═══ */}
        {tab === "fields" && (
          <div className="space-y-4 mt-2">
            {/* Existing fields */}
            {metadataFields.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">
                  Existing Fields
                </Label>
                {metadataFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {field.field_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Values: {field.possible_values.join(", ")} | Default:{" "}
                        {field.default_value}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteField(field.id, field.field_name)
                      }
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new field */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">
                Add New Field
              </Label>
              <Input
                placeholder="Field name (e.g. Environment)"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
              />
              <Input
                placeholder="Possible values (comma-separated, e.g. Dev, Staging, Prod)"
                value={fieldValues}
                onChange={(e) => setFieldValues(e.target.value)}
              />
              <Input
                placeholder="Default value (default: Not Applicable)"
                value={fieldDefault}
                onChange={(e) => setFieldDefault(e.target.value)}
              />
              <Button
                onClick={handleAddField}
                disabled={addingField}
                size="sm"
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                {addingField ? "Adding..." : "Add Field"}
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Tags Tab ═══ */}
        {tab === "tags" && (
          <div className="space-y-4 mt-2">
            {/* Existing tags */}
            {tags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">
                  Existing Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add new tag */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">
                Add New Tag
              </Label>
              <Input
                placeholder="Tag name (e.g. Bug, Feature, Urgent)"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
              />
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Color</Label>
                <div className="flex gap-2">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTagColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        tagColor === c
                          ? "border-slate-900 scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleAddTag}
                disabled={addingTag}
                size="sm"
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                {addingTag ? "Adding..." : "Add Tag"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
