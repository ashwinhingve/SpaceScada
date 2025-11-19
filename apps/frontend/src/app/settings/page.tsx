'use client';

import Link from 'next/link';
import { Key, User, Bell, Shield, Palette } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const settingsSections = [
  {
    title: 'API Keys',
    description: 'Manage API keys for authentication',
    icon: Key,
    href: '/settings/api-keys',
    color: 'text-blue-500',
  },
  {
    title: 'Profile',
    description: 'Manage your profile and account settings',
    icon: User,
    href: '/settings/profile',
    color: 'text-green-500',
  },
  {
    title: 'Notifications',
    description: 'Configure notification preferences',
    icon: Bell,
    href: '/settings/notifications',
    color: 'text-yellow-500',
  },
  {
    title: 'Security',
    description: 'Password and security settings',
    icon: Shield,
    href: '/settings/security',
    color: 'text-red-500',
  },
  {
    title: 'Appearance',
    description: 'Customize theme and display',
    icon: Palette,
    href: '/settings/appearance',
    color: 'text-purple-500',
  },
];

export default function SettingsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Settings"
        description="Manage your account and application settings"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="bg-[#151f2e] border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gray-800 ${section.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription className="mt-1">{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppLayout>
  );
}
