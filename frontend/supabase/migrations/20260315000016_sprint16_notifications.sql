-- ============================================================================
-- Sprint 16: Thông báo — In-app Notifications
-- AncestorTree v2.8.0
-- ============================================================================

-- ─── Notifications table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL
                    CHECK (type IN (
                        'post_comment', 'post_like', 'new_post',
                        'account_verified', 'event_reminder',
                        'new_member', 'system'
                    )),
    title           TEXT NOT NULL,
    body            TEXT,
    link            TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    actor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reference_id    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

COMMENT ON TABLE notifications IS 'Sprint 16: In-app notifications';

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark read)"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- INSERT locked to triggers only (SECURITY DEFINER bypasses RLS).
-- No client-side INSERT needed — notifications created by DB triggers.
CREATE POLICY "No direct insert (triggers only)"
ON notifications FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ─── Trigger: new comment → notify post author ─────────────────────────────

CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.author_id != (SELECT author_id FROM posts WHERE id = NEW.post_id) THEN
        INSERT INTO notifications (user_id, type, title, body, link, actor_id, reference_id)
        SELECT
            p.author_id,
            'post_comment',
            'Bình luận mới',
            (SELECT full_name FROM profiles WHERE user_id = NEW.author_id) || ' đã bình luận bài viết của bạn',
            '/feed',
            NEW.author_id,
            NEW.post_id::text
        FROM posts p WHERE p.id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_post_comment
AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION notify_post_comment();

-- ─── Trigger: new like → notify post author ─────────────────────────────────

CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id != (SELECT author_id FROM posts WHERE id = NEW.post_id) THEN
        INSERT INTO notifications (user_id, type, title, body, link, actor_id, reference_id)
        SELECT
            p.author_id,
            'post_like',
            'Lượt thích mới',
            (SELECT full_name FROM profiles WHERE user_id = NEW.user_id) || ' đã thích bài viết của bạn',
            '/feed',
            NEW.user_id,
            NEW.post_id::text
        FROM posts p WHERE p.id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_post_like
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION notify_post_like();
