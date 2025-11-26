'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Database,
  Star,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NAVIGATION_CONFIG, isPathActive } from '@/features/layout/constants/navigation.config';

interface ConsoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * ConsoleSidebar - Main navigation sidebar
 */
export function ConsoleSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: ConsoleSidebarProps) {
  const pathname = usePathname();
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [topEntitiesOpen, setTopEntitiesOpen] = useState(true);
  const [deviceTypeExpanded, setDeviceTypeExpanded] = useState<Record<string, boolean>>({
    LoRaWAN: false,
    GSM: false,
    'Wi-Fi': false,
    Bluetooth: false,
  });

  const toggleDeviceType = (name: string) => {
    setDeviceTypeExpanded((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // Hardcoded top entities (to be fetched from API later)
  const topEntities = [
    { name: 'Dahi_project', icon: Database },
    { name: 'RM1', icon: Database },
    { name: 'WGW23', icon: Database },
    { name: 'Waarta14', icon: Database },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#1E293B] border-r border-gray-800 z-50 transition-all duration-500 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-72'
        } ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } lg:translate-x-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-sm">SPACE AUTO TECH</h1>
                  <p className="text-gray-400 text-xs">CONSOLE</p>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden lg:block border-b border-gray-800 p-2">
          <button
            onClick={onToggleCollapse}
            className="group w-full flex items-center justify-center px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02]"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search"
                className="w-full bg-[#0F172A] border-gray-700 text-gray-300 pl-10 pr-16 h-9"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">Ctrl</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">K</kbd>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="p-2">
          {/* Main Nav Items */}
          {NAVIGATION_CONFIG.main.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded text-sm transition-all duration-300 hover:scale-[1.01] ${
                isPathActive(pathname, item.href)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-4 w-4 transition-transform duration-300 ${isPathActive(pathname, item.href) ? '' : 'group-hover:scale-110'}`}
              />
              {!isCollapsed && item.name}
            </Link>
          ))}

          {/* Device Types */}
          {!isCollapsed && (
            <div className="mt-4 space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Device Types
              </div>
              {NAVIGATION_CONFIG.deviceTypes.map((deviceType) => (
                <div key={deviceType.name}>
                  <button
                    onClick={() => toggleDeviceType(deviceType.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all duration-300 hover:scale-[1.01] ${
                      isPathActive(pathname, deviceType.href)
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <deviceType.icon className="h-4 w-4" />
                      {deviceType.name}
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        deviceTypeExpanded[deviceType.name] ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {deviceTypeExpanded[deviceType.name] && (
                    <div className="ml-4 mt-1 space-y-1 animate-fade-in">
                      {deviceType.children.map((child, index) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all duration-300 hover:scale-[1.01] ${
                            isPathActive(pathname, child.href, child.exact)
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                          }`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <child.icon className="h-3.5 w-3.5" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User Settings Collapsible */}
          {!isCollapsed && (
            <div className="mt-4">
              <button
                onClick={() => setUserSettingsOpen(!userSettingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = NAVIGATION_CONFIG.userSettings[0].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  User settings
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${userSettingsOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {userSettingsOpen && (
                <div className="ml-4 mt-1 space-y-1 animate-fade-in">
                  {NAVIGATION_CONFIG.userSettings.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all duration-300 hover:scale-[1.01] ${
                        isPathActive(pathname, item.href)
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {isCollapsed && (
            <Link
              href="/console/settings/profile"
              className={`flex items-center justify-center px-3 py-2 rounded text-sm transition-colors mt-4 ${
                pathname.startsWith('/console/settings')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title="User settings"
            >
              {(() => {
                const Icon = NAVIGATION_CONFIG.userSettings[0].icon;
                return <Icon className="h-4 w-4" />;
              })()}
            </Link>
          )}
        </nav>

        {/* Top Entities */}
        {!isCollapsed && (
          <div className="mt-auto border-t border-gray-800">
            <div className="p-2">
              <button
                onClick={() => setTopEntitiesOpen(!topEntitiesOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Top entities
                </div>
                <div className="flex items-center gap-2">
                  <button className="hover:text-white transition-all duration-300 hover:rotate-90">
                    <Plus className="h-4 w-4" />
                  </button>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${topEntitiesOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              {topEntitiesOpen && (
                <div className="mt-1 space-y-1 animate-fade-in">
                  {topEntities.map((entity, index) => (
                    <Link
                      key={entity.name}
                      href="#"
                      className="flex items-center gap-3 px-3 py-2 rounded text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-all duration-300 hover:scale-[1.01]"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <entity.icon className="h-3.5 w-3.5" />
                      {entity.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resources */}
            <div className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300">
                    <Database className="h-4 w-4" />
                    Resources
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#1E293B] border-gray-700">
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">Documentation</DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">API Reference</DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">Support</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
