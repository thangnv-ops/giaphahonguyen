/**
 * @project AncestorTree
 * @file src/components/layout/notification-bell.tsx
 * @description Bell icon with unread badge + dropdown list of notifications
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/components/auth/auth-provider';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { getRelativeTime } from '@/lib/format-utils';
import { NOTIFICATION_TYPE_ICONS } from '@/types';

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  if (!user) return null;

  const handleClickNotification = (id: string, link: string | null, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
    if (link) {
      router.push(link);
    }
  };

  const recent = (notifications || []).slice(0, 10);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <Check className="h-3 w-3 mr-1" />
              Đã đọc tất cả
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Không có thông báo
            </div>
          ) : (
            recent.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClickNotification(n.id, n.link, n.is_read)}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-accent transition-colors ${
                  !n.is_read ? 'bg-accent/40' : ''
                }`}
              >
                <div className="flex gap-2.5">
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {NOTIFICATION_TYPE_ICONS[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                      {n.body || n.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {getRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {(notifications || []).length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => router.push('/notifications')}
            >
              Xem tất cả thông báo
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
