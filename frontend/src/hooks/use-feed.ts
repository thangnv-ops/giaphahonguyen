/**
 * @project AncestorTree
 * @file src/hooks/use-feed.ts
 * @description React Query hooks for feed posts, comments, and likes
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  hidePost,
  unhidePost,
  getPostComments,
  createComment,
  deleteComment,
  toggleLike,
  getUserLikedPosts,
} from '@/lib/supabase-data-feed';
import type { PostType, CreatePostInput, UpdatePostInput, CreateCommentInput } from '@/types';

// ─── Query Keys ─────────────────────────────────────────────────────

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (type?: PostType) => [...postKeys.lists(), { type }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  comments: (postId: string) => [...postKeys.all, 'comments', postId] as const,
  userLikes: (userId: string) => [...postKeys.all, 'userLikes', userId] as const,
};

// ─── Query Hooks ────────────────────────────────────────────────────

export function usePosts(type?: PostType, showHidden = false) {
  return useQuery({
    queryKey: [...postKeys.list(type), { showHidden }],
    queryFn: () => getPosts(type, showHidden),
  });
}

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: postKeys.detail(id!),
    queryFn: () => getPost(id!),
    enabled: !!id,
  });
}

export function usePostComments(postId: string | undefined) {
  return useQuery({
    queryKey: postKeys.comments(postId!),
    queryFn: () => getPostComments(postId!),
    enabled: !!postId,
  });
}

export function useUserLikedPosts(userId: string | undefined) {
  return useQuery({
    queryKey: postKeys.userLikes(userId!),
    queryFn: () => getUserLikedPosts(userId!),
    enabled: !!userId,
  });
}

// ─── Mutation Hooks ─────────────────────────────────────────────────

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePostInput }) => updatePost(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useHidePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hide }: { id: string; hide: boolean }) =>
      hide ? hidePost(id) : unhidePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => createComment(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(variables.post_id) });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postId }: { id: string; postId: string }) => deleteComment(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(variables.postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleLike(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
}
