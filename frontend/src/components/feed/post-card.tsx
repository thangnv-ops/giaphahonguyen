/**
 * @project AncestorTree
 * @file src/components/feed/post-card.tsx
 * @description Post card component for feed timeline
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Heart, MoreHorizontal, Trash2, EyeOff, Eye } from 'lucide-react';
import { useDeletePost, useHidePost, useToggleLike } from '@/hooks/use-feed';
import { CommentsSection } from './comments-section';
import { POST_TYPE_LABELS } from '@/types';
import type { Post, Profile } from '@/types';
import { getRelativeTime, getInitials } from '@/lib/format-utils';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
  profileMap: Map<string, Profile>;
  currentUserId?: string;
  isLiked: boolean;
  isAdmin?: boolean;
  isEditor?: boolean;
}

export function PostCard({
  post,
  profileMap,
  currentUserId,
  isLiked,
  isAdmin,
  isEditor,
}: PostCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deletePost = useDeletePost();
  const hidePost = useHidePost();
  const toggleLike = useToggleLike();

  const author = profileMap.get(post.author_id);
  const authorName = author?.full_name || 'Ẩn danh';
  const isOwner = post.author_id === currentUserId;
  const canModerate = isAdmin || isEditor;
  const canDelete = isOwner || isAdmin;
  const isHidden = post.status === 'hidden';

  const handleLike = () => {
    toggleLike.mutate(post.id, {
      onError: () => toast.error('Lỗi khi thả tim'),
    });
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success('Đã xóa bài viết');
    } catch {
      toast.error('Lỗi khi xóa bài viết');
    }
    setShowDeleteDialog(false);
  };

  const handleToggleHide = () => {
    hidePost.mutate(
      { id: post.id, hide: !isHidden },
      {
        onSuccess: () => toast.success(isHidden ? 'Đã hiện bài viết' : 'Đã ẩn bài viết'),
        onError: () => toast.error('Lỗi'),
      }
    );
  };

  // Image grid layout
  const renderImages = () => {
    const images = post.images || [];
    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <div className="rounded-md overflow-hidden">
          <img src={images[0]} alt="" className="w-full max-h-96 object-cover" />
        </div>
      );
    }

    return (
      <div className={`grid gap-1 rounded-md overflow-hidden ${
        images.length === 2 ? 'grid-cols-2' :
        images.length === 3 ? 'grid-cols-2' :
        'grid-cols-2'
      }`}>
        {images.slice(0, 4).map((url, i) => (
          <div key={i} className={`relative ${
            images.length === 3 && i === 0 ? 'col-span-2' : ''
          }`}>
            <img src={url} alt="" className="w-full h-40 object-cover" />
            {i === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-bold">
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className={isHidden ? 'opacity-60 border-dashed' : ''}>
        <CardContent className="pt-4 space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">{getInitials(authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{authorName}</span>
                {post.post_type !== 'general' && (
                  <Badge variant="secondary" className="text-[10px]">
                    {POST_TYPE_LABELS[post.post_type]}
                  </Badge>
                )}
                {isHidden && (
                  <Badge variant="outline" className="text-[10px] text-amber-600">Đã ẩn</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{getRelativeTime(post.created_at)}</p>
            </div>

            {/* Actions menu */}
            {(isOwner || canModerate) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canModerate && (
                    <DropdownMenuItem onClick={handleToggleHide}>
                      {isHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                      {isHidden ? 'Hiện bài viết' : 'Ẩn bài viết'}
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa bài viết
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>

          {/* Images */}
          {renderImages()}

          {/* Action bar */}
          <div className="flex items-center gap-4 pt-1">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
              }`}
              disabled={toggleLike.isPending}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {post.likes_count > 0 && <span>{post.likes_count}</span>}
            </button>

            <CommentsSection
              postId={post.id}
              commentsCount={post.comments_count}
              profileMap={profileMap}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
