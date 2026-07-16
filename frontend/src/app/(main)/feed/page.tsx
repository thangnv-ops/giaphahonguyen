/**
 * @project AncestorTree
 * @file src/app/(main)/feed/page.tsx
 * @description Community feed page — timeline + compose + filter
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { usePosts, useUserLikedPosts } from '@/hooks/use-feed';
import { useProfiles } from '@/hooks/use-profiles';
import { ComposeBox } from '@/components/feed/compose-box';
import { PostCard } from '@/components/feed/post-card';
import { POST_TYPE_LABELS } from '@/types';
import type { PostType, Profile } from '@/types';

const FILTER_TABS: { key: PostType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  ...Object.entries(POST_TYPE_LABELS).map(([key, label]) => ({
    key: key as PostType,
    label,
  })),
];

export default function FeedPage() {
  const { user, isAdmin, isEditor } = useAuth();
  const [activeFilter, setActiveFilter] = useState<PostType | 'all'>('all');

  const filterType = activeFilter === 'all' ? undefined : activeFilter;
  const { data: posts, isLoading: postsLoading } = usePosts(filterType);
  const { data: profiles } = useProfiles();
  const { data: likedPostIds } = useUserLikedPosts(user?.id);

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const p of profiles || []) {
      map.set(p.user_id, p);
    }
    return map;
  }, [profiles]);

  const likedSet = useMemo(() => new Set(likedPostIds || []), [likedPostIds]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Góc giao lưu</h1>
        <p className="text-muted-foreground">Không gian chia sẻ của con cháu dòng họ</p>
      </div>

      {/* Compose box */}
      {user && <ComposeBox />}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TABS.map(tab => (
          <Badge
            key={tab.key}
            variant={activeFilter === tab.key ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
          </Badge>
        ))}
      </div>

      {/* Posts list */}
      {postsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {activeFilter !== 'all'
            ? 'Không có bài viết nào trong mục này'
            : 'Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!'}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              profileMap={profileMap}
              currentUserId={user?.id}
              isLiked={likedSet.has(post.id)}
              isAdmin={isAdmin}
              isEditor={isEditor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
