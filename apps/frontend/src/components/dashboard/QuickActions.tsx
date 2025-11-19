'use client';

import { Cpu, Key, Monitor, Radio, Users, Smartphone } from 'lucide-react';
import { QuickActionCard } from '@/components/layout/QuickActionCard';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  href: string;
}

export function QuickActions() {
  const actions: QuickAction[] = [
    {
      id: 'create-application',
      label: 'Create application',
      icon: Monitor,
      href: '/projects/new',
    },
    {
      id: 'add-device',
      label: 'Add end device',
      icon: Cpu,
      href: '/devices/new',
    },
    {
      id: 'create-organization',
      label: 'Create organization',
      icon: Users,
      href: '/organizations/new',
    },
    {
      id: 'add-api-key',
      label: 'Add API key',
      icon: Key,
      href: '/settings/api-keys/new',
    },
    {
      id: 'register-gateway',
      label: 'Register gateway',
      icon: Radio,
      href: '/gateways/new',
    },
    {
      id: 'gsm-devices',
      label: 'GSM Devices',
      icon: Smartphone,
      href: '/gsm',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {actions.map((action) => (
        <QuickActionCard
          key={action.id}
          title={action.label}
          icon={action.icon}
          href={action.href}
        />
      ))}
    </div>
  );
}
