---
project: AncestorTree
path: docs/04-build/SPRINT-16-SPEC.md
type: build
version: 1.0.0
updated: 2026-03-09
owner: "@pm"
status: draft
---

# Sprint 16 — Thông báo (v2.8.0)

## 1. Context & Motivation

### Business Need

Hiện tại AncestorTree không có hệ thống thông báo. Người dùng không biết khi:

- Có bài viết mới trong Góc giao lưu
- Bài viết của mình được bình luận / thả tim
- Admin xác nhận tài khoản
- Có sự kiện sắp diễn ra (giỗ, lễ)
- Có thành viên mới đăng ký

### Scope

- **In scope:** In-app notifications (bell icon + dropdown), notification preferences
- **Out of scope:** Push notifications (browser/mobile), email notifications, real-time WebSocket

### Dependencies

- Sprint 15 complete (v2.7.0)
- `profiles` table (user_id, role)
- `posts`, `post_comments`, `post_likes` tables (Sprint 13)
- `events` table (Sprint 4)

---

## 2. Architecture Decisions

### AD-01: Polling, không Realtime

Supabase Realtime tốn resource cho ~30-50 users. Dùng polling 60s interval đủ tốt.
Nếu sau này scale lên, chuyển sang Realtime subscription dễ dàng.

### AD-02: notifications table + DB triggers

Triggers tự tạo notification khi có INSERT vào `post_comments`, `post_likes`, `posts`.
Giảm logic ở application layer.

### AD-03: Notification preferences trong profiles

Thêm cột `notification_prefs JSONB DEFAULT '{}'` vào profiles.
User tự chọn loại thông báo muốn nhận.

---

## 3. Database Design

### 3.1 Migration: `20260315000016_sprint16_notifications.sql`

```sql
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
    link            TEXT,                -- relative URL to navigate to
    is_read         BOOLEAN NOT NULL DEFAULT false,
    actor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reference_id    TEXT,                -- post_id, event_id, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark read)"
ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System/triggers can insert
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Auto-delete old notifications (> 90 days)
-- Run via Supabase cron or application-level cleanup
```

### 3.2 Notification triggers

```sql
-- Trigger: new comment → notify post author
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't notify if author comments on own post
    IF NEW.author_id != (SELECT author_id FROM posts WHERE id = NEW.post_id) THEN
        INSERT INTO notifications (user_id, type, title, body, link, actor_id, reference_id)
        SELECT
            p.author_id,
            'post_comment',
            'Bình luận mới',
            (SELECT display_name FROM profiles WHERE user_id = NEW.author_id) || ' đã bình luận bài viết của bạn',
            '/feed',
            NEW.author_id,
            NEW.post_id::text
        FROM posts p WHERE p.id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_post_comment
AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION notify_post_comment();

-- Trigger: new like → notify post author
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id != (SELECT author_id FROM posts WHERE id = NEW.post_id) THEN
        INSERT INTO notifications (user_id, type, title, body, link, actor_id, reference_id)
        SELECT
            p.author_id,
            'post_like',
            'Lượt thích mới',
            (SELECT display_name FROM profiles WHERE user_id = NEW.user_id) || ' đã thích bài viết của bạn',
            '/feed',
            NEW.user_id,
            NEW.post_id::text
        FROM posts p WHERE p.id = NEW.post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_post_like
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION notify_post_like();
```

### 3.3 Desktop SQLite

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    link            TEXT,
    is_read         INTEGER NOT NULL DEFAULT 0,
    actor_id        TEXT,
    reference_id    TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
```

---

## 4. Data Layer & Hooks

### File: `src/lib/supabase-data-notifications.ts`

| # | Function | Description |
|---|----------|-------------|
| 1 | `getNotifications(limit)` | Lấy notifications của user hiện tại, mới nhất trước |
| 2 | `getUnreadCount()` | Đếm số thông báo chưa đọc |
| 3 | `markAsRead(id)` | Đánh dấu đã đọc 1 thông báo |
| 4 | `markAllAsRead()` | Đánh dấu tất cả đã đọc |
| 5 | `deleteNotification(id)` | Xoá 1 thông báo |

### File: `src/hooks/use-notifications.ts`

| # | Hook | Type | Key |
|---|------|------|-----|
| 1 | `useNotifications` | Query | `['notifications', 'list']` |
| 2 | `useUnreadCount` | Query | `['notifications', 'unread']` — refetch every 60s |
| 3 | `useMarkAsRead` | Mutation | Invalidates notifications keys |
| 4 | `useMarkAllAsRead` | Mutation | Invalidates notifications keys |

---

## 5. UI Components

### 5.1 NotificationBell (header)

```text
┌─────┐
│ 🔔3 │  ← Bell icon + unread badge (red dot with count)
└──┬──┘
   │
   ▼ (click to open dropdown)
┌────────────────────────────────────┐
│ Thông báo                    [✓ Tất cả đã đọc] │
├────────────────────────────────────┤
│ ● Nguyễn Thị A đã bình luận bài   │
│   viết của bạn — 5 phút trước     │
├────────────────────────────────────┤
│ ○ Tài khoản đã được xác nhận      │
│   — 2 giờ trước                   │
├────────────────────────────────────┤
│ [Xem tất cả thông báo]            │
└────────────────────────────────────┘
```

● = chưa đọc (bold + dot), ○ = đã đọc (muted)

### 5.2 Notifications Page: `/notifications`

Full list, phân trang, filter by type, mark as read.

### 5.3 Files

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260315000016_sprint16_notifications.sql` | NEW | Table + RLS + triggers |
| `desktop/migrations/008-sprint16-notifications.sql` | NEW | SQLite version |
| `src/lib/supabase-data-notifications.ts` | NEW | Data layer (5 functions) |
| `src/hooks/use-notifications.ts` | NEW | React Query hooks |
| `src/types/index.ts` | MODIFY | Notification type |
| `src/components/layout/notification-bell.tsx` | NEW | Header bell + dropdown |
| `src/components/layout/header.tsx` | MODIFY | Add NotificationBell |
| `src/app/(main)/notifications/page.tsx` | NEW | Full notifications page |
| `src/app/(main)/notifications/error.tsx` | NEW | Error boundary |
| `src/app/(main)/notifications/loading.tsx` | NEW | Loading skeleton |
| `src/components/layout/app-sidebar.tsx` | MODIFY | Nav item |
| `src/proxy.ts` | MODIFY | Auth path |

---

## 6. Execution Order

```text
Phase 1: Database (30m)
├── S16-01: Supabase migration (notifications + triggers)
└── S16-02: Desktop SQLite migration

Phase 2: Types + Data + Hooks (1h)
├── S16-03: Notification type in index.ts
├── S16-04: supabase-data-notifications.ts
└── S16-05: use-notifications.ts

Phase 3: UI (2h)
├── S16-06: NotificationBell component (header dropdown)
├── S16-07: Notifications page (/notifications)
└── S16-08: Error/loading boundaries

Phase 4: Infrastructure (20m)
└── S16-09: Sidebar + header + proxy.ts

Phase 5: Build & verify (30m)
└── S16-10: pnpm build + QA
```

**Total estimate: ~4.5h**

---

## 7. Verification Checklist

- [ ] Bình luận bài viết → tác giả bài nhận thông báo
- [ ] Thả tim bài viết → tác giả bài nhận thông báo
- [ ] Tự bình luận bài mình → KHÔNG nhận thông báo
- [ ] Bell icon hiện số thông báo chưa đọc
- [ ] Click thông báo → navigate đến link + đánh dấu đã đọc
- [ ] "Tất cả đã đọc" → badge biến mất
- [ ] Desktop mode hoạt động
- [ ] `pnpm build` passes

---

*SDLC Framework 6.1.1 - Stage 04 Build*
