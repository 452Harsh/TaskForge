"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, User2, MessageSquare } from "lucide-react";
import { addComment, deleteComment } from "@/lib/actions/comments";
import { toast } from "sonner";

export type CommentData = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentSection({
  comments,
  currentUserId,
  taskId,
  projectId,
}: {
  comments: CommentData[];
  currentUserId: string;
  taskId: string;
  projectId: string;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const result = await addComment(taskId, projectId, content);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      setContent("");
      toast.success("Comment added");
    }
  };

  const handleDelete = async (commentId: string) => {
    // Optimistic UI could be implemented here, but we'll cleanly await action
    setDeletingId(commentId);
    const result = await deleteComment(commentId, taskId, projectId);
    setDeletingId(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Comment deleted");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[800px]">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 shrink-0">
        <MessageSquare className="h-5 w-5 text-slate-400" />
        <h3 className="font-semibold text-lg text-slate-900">Comments</h3>
        <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full ml-1">
          {comments.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2 scrollbar-thin">
        {comments.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-900 mb-1">No comments yet</p>
            <p className="text-xs text-slate-500">Be the first to start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group items-start">
                <Avatar className="h-8 w-8 border border-slate-200 shrink-0 bg-slate-100 mt-1">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] text-slate-600 font-medium">
                    {comment.profiles?.full_name?.charAt(0) || <User2 className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm p-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {comment.profiles?.full_name || "Unknown user"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>

                    {comment.user_id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-600 hover:bg-transparent"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete comment</span>
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-[14px] text-zinc-700 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mt-auto pt-6 border-t border-zinc-100 flex gap-3 shrink-0">
        <Avatar className="h-8 w-8 shrink-0 mt-1 bg-zinc-100">
          <AvatarFallback className="text-zinc-500">
            <User2 className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave a comment..."
            className="min-h-[80px] text-[14px] resize-none border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-lg bg-zinc-50/50 focus:bg-white transition-colors"
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitting || !content.trim()}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-md px-4 h-8 text-[13px] font-medium"
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
