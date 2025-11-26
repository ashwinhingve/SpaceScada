'use client';

import React from 'react';
import { Menu, Settings, Star, Bell, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddMenu } from './AddMenu';
import { UserMenu } from './UserMenu';

interface ConsoleHeaderProps {
  onMenuClick: () => void;
}

/**
 * ConsoleHeader - Top header bar with actions
 */
export function ConsoleHeader({ onMenuClick }: ConsoleHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#1E293B] border-b border-gray-800 h-16">
      <div className="flex items-center justify-between h-full px-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Breadcrumb or page title placeholder */}
        <div className="flex-1" />

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Maintenance Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-sm">
            <Settings className="h-4 w-4 animate-spin" />
            Maintenance in progress
          </div>

          {/* Add Menu */}
          <AddMenu />

          {/* Icon Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Star className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Bell className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Settings className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Mail className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
