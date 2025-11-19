import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  className?: string;
}

export function QuickActionCard({ title, icon: Icon, href, className }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center space-x-3 rounded-xl bg-blue-300 p-4 transition-all hover:bg-blue-400 hover:scale-105',
        className
      )}
    >
      <div className="flex-shrink-0">
        <Icon className="h-6 w-6 text-blue-700" />
      </div>
      <span className="text-sm font-medium text-blue-900">{title}</span>
    </Link>
  );
}
