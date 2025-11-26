'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Bell, Save } from 'lucide-react';

interface NotificationSettings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

export default function EmailNotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    notificationFrequency: 'realtime',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/me/settings');
      const data = await response.json();

      if (data.settings) {
        setSettings({
          notificationsEnabled: data.settings.notifications_enabled,
          emailNotifications: data.settings.email_notifications,
          pushNotifications: data.settings.push_notifications,
          smsNotifications: data.settings.sms_notifications,
          notificationFrequency: data.settings.notification_frequency,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/users/me/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification settings updated successfully' });
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const notificationTypes = [
    {
      id: 'system',
      name: 'System Updates',
      description: 'Get notified about system maintenance and updates',
      enabled: settings.notificationsEnabled,
    },
    {
      id: 'security',
      name: 'Security Alerts',
      description: 'Important security notifications and login alerts',
      enabled: settings.notificationsEnabled,
    },
    {
      id: 'devices',
      name: 'Device Status',
      description: 'Notifications about device connectivity and status changes',
      enabled: settings.notificationsEnabled,
    },
    {
      id: 'alarms',
      name: 'Alarms & Warnings',
      description: 'Critical alarms and warning notifications',
      enabled: settings.notificationsEnabled,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Email Notifications</h1>
        <p className="text-gray-400">Manage how and when you receive notifications</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Master Toggle */}
        <Card className="bg-[#1E293B] border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-blue-400 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Enable Notifications</h2>
                <p className="text-sm text-gray-400">
                  Master switch for all notification types
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, notificationsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>

        {/* Notification Channels */}
        <Card className="bg-[#1E293B] border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Channels</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-sm text-gray-400">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, emailNotifications: e.target.checked })
                  }
                  disabled={!settings.notificationsEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-white font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-400">Browser push notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, pushNotifications: e.target.checked })
                  }
                  disabled={!settings.notificationsEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Notification Frequency */}
        <Card className="bg-[#1E293B] border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Frequency</h2>
          <div className="space-y-3">
            {[
              { value: 'realtime', label: 'Real-time', description: 'Receive notifications immediately' },
              { value: 'hourly', label: 'Hourly', description: 'Digest every hour' },
              { value: 'daily', label: 'Daily', description: 'Daily summary at 9 AM' },
              { value: 'weekly', label: 'Weekly', description: 'Weekly summary every Monday' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.notificationFrequency === option.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                } ${!settings.notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="frequency"
                    value={option.value}
                    checked={settings.notificationFrequency === option.value}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notificationFrequency: e.target.value as 'realtime' | 'hourly' | 'daily' | 'weekly',
                      })
                    }
                    disabled={!settings.notificationsEnabled}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600"
                  />
                  <div>
                    <p className="text-white font-medium">{option.label}</p>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="bg-[#1E293B] border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Types</h2>
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <div
                key={type.id}
                className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 ${
                  type.enabled ? '' : 'opacity-50'
                }`}
              >
                <div>
                  <p className="text-white font-medium">{type.name}</p>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    type.enabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {type.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
