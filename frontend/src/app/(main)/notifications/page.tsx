/**
 * @project AncestorTree
 * @file src/app/(main)/notifications/page.tsx
 * @description Full notifications list page with mark as read
 * @version 1.0.0
 * @updated 2026-03-09
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Loader2, Trash2 } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/use-notifications';
import { getRelativeTime } from '@/lib/format-utils';
import { NOTIFICATION_TYPE_ICONS, NOTIFICATION_TYPE_LABELS } from '@/types';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  const handleClick = (id: string, link: string | null, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
    if (link) {
      router.push(link);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotif.mutate(id, {
      onError: () => toast.error('Lỗi khi xóa thông báo'),
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Thông báo
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} chưa đọc</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <Check className="h-4 w-4 mr-1.5" />
            Đã đọc tất cả
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có thông báo nào
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                !n.is_read ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : ''
              }`}
              onClick={() => handleClick(n.id, n.link, n.is_read)}
            >
              <CardHeader className="pb-1 pt-3 px-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">
                    {NOTIFICATION_TYPE_ICONS[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <CardTitle className={`text-sm ${!n.is_read ? 'font-semibold' : 'font-normal text-muted-foreground'}`}>
                      {n.title}
                    </CardTitle>
                    {n.body && (
                      <p className={`text-sm mt-0.5 ${!n.is_read ? '' : 'text-muted-foreground'}`}>
                        {n.body}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {getRelativeTime(n.created_at)}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {NOTIFICATION_TYPE_LABELS[n.type] || n.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!n.is_read && (
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={e => handleDelete(e, n.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
