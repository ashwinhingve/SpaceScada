'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, Filter, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.read = filter === 'read' ? 'true' : 'false';
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/api/notifications?${queryString}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/notifications/unread/count`);
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST',
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/notifications/read`, {
        method: 'DELETE',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <Bell className="h-7 w-7" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-gray-400">Stay updated with your system activities</p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="border-gray-700 text-gray-300"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteAllRead}
            className="border-gray-700 text-gray-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#1E293B] border-gray-800 p-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-gray-400 text-sm">Filter:</span>
          <div className="flex gap-2">
            {([
              { value: 'all' as const, label: 'All' },
              { value: 'unread' as const, label: 'Unread' },
              { value: 'read' as const, label: 'Read' },
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0F172A] text-gray-400 hover:text-gray-300 border border-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <Card className="bg-[#1E293B] border-gray-800 p-12 text-center">
          <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Notifications</h3>
          <p className="text-gray-400">
            {filter === 'unread'
              ? "You're all caught up! No unread notifications."
              : filter === 'read'
              ? 'No read notifications found.'
              : 'You have no notifications at this time.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border-2 ${
                notification.read
                  ? 'bg-[#1E293B] border-gray-800 opacity-75'
                  : `${getSeverityColor(notification.severity)} border-2`
              } transition-all hover:shadow-lg`}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(notification.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                          <span className="capitalize">{notification.type}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="inline-flex items-center gap-1 mt-3 text-sm text-blue-400 hover:text-blue-300"
                      >
                        View Details →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
