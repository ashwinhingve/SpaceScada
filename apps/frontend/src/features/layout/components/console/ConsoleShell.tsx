'use client';

import React, { useState } from 'react';
import { ConsoleSidebar } from './ConsoleSidebar';
import { ConsoleHeader } from './ConsoleHeader';

interface ConsoleShellProps {
  children: React.ReactNode;
}

/**
 * ConsoleShell - Main console layout wrapper
 * Manages sidebar state and provides the overall layout structure
 */
export function ConsoleShell({ children }: ConsoleShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Sidebar */}
      <ConsoleSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'}`}>
        {/* Top Header */}
        <ConsoleHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
