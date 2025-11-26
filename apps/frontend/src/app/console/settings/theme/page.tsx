'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>('dark');
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
        setSettings(data.settings);
        setSelectedTheme(data.settings.theme);
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
        body: JSON.stringify({ theme: selectedTheme }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Theme updated successfully' });
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Failed to update theme' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const themes = [
    {
      value: 'light' as const,
      name: 'Light',
      description: 'Clean and bright interface',
      icon: Sun,
      preview: 'bg-gray-50 border-gray-200',
    },
    {
      value: 'dark' as const,
      name: 'Dark',
      description: 'Easier on the eyes',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-700',
    },
    {
      value: 'auto' as const,
      name: 'System',
      description: 'Follows system preference',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-gray-50 to-gray-900 border-gray-500',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Appearance</h1>
        <p className="text-gray-400">Customize how WebSCADA looks on your device</p>
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

      <Card className="bg-[#1E293B] border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Theme</h2>
        <p className="text-gray-400 text-sm mb-6">
          Select your preferred color theme for the interface
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setSelectedTheme(theme.value)}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                selectedTheme === theme.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-[#0F172A] hover:border-gray-600'
              }`}
            >
              {selectedTheme === theme.value && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div className={`w-full h-24 rounded-lg mb-4 ${theme.preview}`} />
                <theme.icon className="h-6 w-6 text-gray-400 mb-2" />
                <h3 className="text-white font-medium">{theme.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{theme.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <Button
            onClick={handleSave}
            disabled={saving || selectedTheme === settings?.theme}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
