'use client';

import { ArrowRight, Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/format';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'warning' | 'error' | 'success';
  read?: boolean;
}

export interface NotificationsPanelProps {
  notifications: Notification[];
  onViewAll?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsPanel({
  notifications,
  onViewAll,
  onNotificationClick,
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-500';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-primary" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          <CardTitle>Notifications</CardTitle>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
        </div>
        {onViewAll && (
          <Button variant="link" onClick={onViewAll} className="text-primary hover:text-primary/80">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                !notification.read ? 'bg-accent/30' : 'bg-card/50'
              } ${getTypeColor(notification.type)}`}
              onClick={() => onNotificationClick?.(notification)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase">Message</span>
                    {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <h4 className="font-semibold mt-1 truncate">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(notification.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
