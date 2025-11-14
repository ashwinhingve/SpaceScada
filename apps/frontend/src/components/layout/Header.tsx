'use client';

import { Bell, Menu } from 'lucide-react';

import { ConnectionIndicator } from '@/components/dashboard/ConnectionIndicator';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export const Header = ({ onMenuClick, className }: HeaderProps) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="mr-4 inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 2v20M2 12h20" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">WebSCADA</h1>
            <p className="text-xs text-muted-foreground">Real-time Monitoring</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <ConnectionIndicator className="hidden md:flex" />

          {/* Notifications */}
          <button
            className="relative inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              3
            </span>
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right text-sm">
              <p className="font-medium">Operator</p>
              <p className="text-xs text-muted-foreground">operator@webscada.local</p>
            </div>
            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-80">
              <span className="font-medium">OP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile connection indicator */}
      <div className="border-t px-4 py-2 md:hidden">
        <ConnectionIndicator />
      </div>
    </header>
  );
};
