/**
 * @project AncestorTree
 * @file src/lib/supabase-data-feed.ts
 * @description Data layer for feed posts, comments, and likes
 * @version 1.0.0
 * @updated 2026-03-09
 */

import { supabase } from './supabase';
import type { Post, PostComment, PostLike, PostType, CreatePostInput, UpdatePostInput, CreateCommentInput } from '@/types';

// Security: allowlist for mass-assignment protection
const ALLOWED_POST_FIELDS = ['content', 'post_type', 'images'] as const;
const ALLOWED_UPDATE_FIELDS = ['content', 'post_type', 'images', 'status'] as const;
const MAX_IMAGES = 5;

function isValidImageUrl(url: string): boolean {
  const isSupabase = url.includes('/storage/v1/object/');
  const isDesktop = url.startsWith('/api/media/');
  return isSupabase || isDesktop;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getPosts(type?: PostType, showHidden = false): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (!showHidden) {
    query = query.eq('status', 'published');
  }

  if (type) {
    query = query.eq('post_type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Validate content
  const content = (input.content || '').trim();
  if (!content || content.length > 5000) {
    throw new Error('Nội dung bài viết phải từ 1-5000 ký tự');
  }

  // Validate images
  const images = (input.images || []).slice(0, MAX_IMAGES);
  for (const url of images) {
    if (!isValidImageUrl(url)) {
      throw new Error(`Invalid image URL: ${url}`);
    }
  }

  // Mass-assignment protection
  const safeInput: Record<string, unknown> = {
    content,
    post_type: input.post_type || 'general',
    images,
  };

  const { data, error } = await supabase
    .from('posts')
    .insert({ ...safeInput, author_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<Post> {
  // Validate images if provided
  if (input.images) {
    const images = input.images.slice(0, MAX_IMAGES);
    for (const url of images) {
      if (!isValidImageUrl(url)) {
        throw new Error(`Invalid image URL: ${url}`);
      }
    }
    input = { ...input, images };
  }

  // Mass-assignment protection
  const safeInput: Record<string, unknown> = {};
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in input) {
      safeInput[key] = input[key as keyof UpdatePostInput];
    }
  }
  safeInput.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('posts')
    .update(safeInput)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function hidePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ status: 'hidden', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function unhidePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ─── Comments ───────────────────────────────────────────────────────────────

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createComment(input: CreateCommentInput): Promise<PostComment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const content = input.content.trim();
  if (!content || content.length > 2000) {
    throw new Error('Comment content must be 1-2000 characters');
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: input.post_id,
      content,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Likes ──────────────────────────────────────────────────────────────────

export async function toggleLike(postId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already liked
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return false;
  } else {
    // Like
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id });

    if (error) throw error;
    return true;
  }
}

export async function getPostLikes(postId: string): Promise<PostLike[]> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('*')
    .eq('post_id', postId);

  if (error) throw error;
  return data || [];
}

export async function getUserLikedPosts(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map(d => d.post_id);
}
