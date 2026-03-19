"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { addProjectMember, removeProjectMember } from "@/lib/actions/projects";

type Profile = {
  id: string;
  full_name: string | null;
};

type Member = {
  user_id: string;
  profiles: { full_name: string | null } | null;
};

export function ManageMembersDialog({
  projectId,
  ownerId,
  currentMembers,
  allProfiles,
}: {
  projectId: string;
  ownerId: string;
  currentMembers: Member[];
  allProfiles: Profile[];
}) {
  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Profiles not yet in the project (excluding owner — they're always in)
  const memberIds = new Set(currentMembers.map((m) => m.user_id));
  const nonMembers = allProfiles.filter((p) => !memberIds.has(p.id));

  const handleAdd = async (userId: string, name: string) => {
    setLoadingId(userId);
    const result = await addProjectMember(projectId, userId);
    setLoadingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${name} added to project`);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    setLoadingId(userId);
    const result = await removeProjectMember(projectId, userId);
    setLoadingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${name} removed from project`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Manage Project Members</DialogTitle>
          <DialogDescription>
            Add or remove members. Added members can see this project and their assigned tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Current Members */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Current Members ({currentMembers.length})
            </h4>
            <div className="space-y-2">
              {currentMembers.map((m) => {
                const name = m.profiles?.full_name || "Unknown";
                const isOwner = m.user_id === ownerId;
                return (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">
                          {name.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{name}</span>
                      {isOwner && (
                        <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                          Owner
                        </span>
                      )}
                    </div>
                    {!isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(m.user_id, name)}
                        disabled={loadingId === m.user_id}
                      >
                        {loadingId === m.user_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Members */}
          {nonMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Add to Project
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nonMembers.map((p) => {
                  const name = p.full_name || "Unknown";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleAdd(p.id, name)}
                        disabled={loadingId === p.id}
                      >
                        {loadingId === p.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {nonMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 bg-gray-50 rounded-lg">
              All registered users are already members of this project.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
