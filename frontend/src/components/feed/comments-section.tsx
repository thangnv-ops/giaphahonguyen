/**
 * @project AncestorTree
 * @file src/components/feed/comments-section.tsx
 * @description Expandable comments section for feed posts
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Loader2, Trash2, Send } from 'lucide-react';
import { usePostComments, useCreateComment, useDeleteComment } from '@/hooks/use-feed';
import type { Profile } from '@/types';
import { getRelativeTime, getInitials } from '@/lib/format-utils';
import { toast } from 'sonner';

interface CommentsSectionProps {
  postId: string;
  commentsCount: number;
  profileMap: Map<string, Profile>;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function CommentsSection({
  postId,
  commentsCount,
  profileMap,
  currentUserId,
  isAdmin,
}: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { data: comments, isLoading } = usePostComments(isExpanded ? postId : undefined);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const handleSubmitComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;

    try {
      await createComment.mutateAsync({ post_id: postId, content: trimmed });
      setNewComment('');
    } catch {
      toast.error('Lỗi khi gửi bình luận');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ id: commentId, postId });
    } catch {
      toast.error('Lỗi khi xóa bình luận');
    }
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {commentsCount > 0 ? `${commentsCount} bình luận` : 'Bình luận'}
      </button>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t">
      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {(comments || []).map(comment => {
            const author = profileMap.get(comment.author_id);
            const authorName = author?.full_name || 'Ẩn danh';
            const canDelete = comment.author_id === currentUserId || isAdmin;

            return (
              <div key={comment.id} className="flex gap-2 group">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-muted rounded-lg px-3 py-1.5">
                    <span className="text-xs font-medium">{authorName}</span>
                    <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {getRelativeTime(comment.created_at)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add comment */}
      {currentUserId && (
        <div className="flex gap-2">
          <Input
            placeholder="Viết bình luận..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            className="h-8 text-sm"
            maxLength={2000}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSubmitComment}
            disabled={createComment.isPending || !newComment.trim()}
            className="h-8 px-2"
          >
            {createComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
