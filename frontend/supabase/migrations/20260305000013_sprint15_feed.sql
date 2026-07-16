-- ============================================================================
-- Sprint 15: Góc giao lưu — Feed + Comments + Likes
-- AncestorTree v2.7.0
-- ============================================================================

-- ─── Posts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL CHECK (char_length(content) <= 5000),
    images          JSONB DEFAULT '[]'::jsonb,
    post_type       VARCHAR(20) NOT NULL DEFAULT 'general'
                    CHECK (post_type IN ('general', 'photo', 'milestone', 'memory', 'announcement')),
    status          VARCHAR(20) NOT NULL DEFAULT 'published'
                    CHECK (status IN ('published', 'hidden')),
    likes_count     INTEGER NOT NULL DEFAULT 0,
    comments_count  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX idx_posts_type ON posts(post_type);

COMMENT ON TABLE posts IS 'Sprint 15: Feed posts — bài viết giao lưu dòng họ';
COMMENT ON COLUMN posts.images IS 'JSONB array of image URLs, max 5 per post';
COMMENT ON COLUMN posts.post_type IS 'general|photo|milestone|memory|announcement';

-- ─── Post Likes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);

-- ─── Post Comments ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL CHECK (char_length(content) <= 2000),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_comments_author ON post_comments(author_id);

-- ─── Trigger: update likes_count ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- ─── Trigger: update comments_count ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ─── RLS: posts ─────────────────────────────────────────────────────────────

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published posts"
ON posts FOR SELECT TO authenticated
USING (status = 'published');

CREATE POLICY "Admin/editor can view all posts"
ON posts FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'editor')
    )
);

CREATE POLICY "Verified users can create posts"
ON posts FOR INSERT TO authenticated
WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.is_verified = true
    )
);

CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admin/editor can update any post"
ON posts FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'editor')
    )
);

CREATE POLICY "Authors can delete own posts"
ON posts FOR DELETE TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Admin can delete any post"
ON posts FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- ─── RLS: post_likes ────────────────────────────────────────────────────────

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view likes"
ON post_likes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Verified users can like posts"
ON post_likes FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.is_verified = true
    )
);

CREATE POLICY "Users can unlike (delete own like)"
ON post_likes FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ─── RLS: post_comments ─────────────────────────────────────────────────────

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
ON post_comments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Verified users can comment"
ON post_comments FOR INSERT TO authenticated
WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.is_verified = true
    )
);

CREATE POLICY "Authors can update own comments"
ON post_comments FOR UPDATE TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments"
ON post_comments FOR DELETE TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Admin can delete any comment"
ON post_comments FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);
