'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Layers,
  Radio,
  Settings,
  Bell,
  User,
  ChevronDown,
  Search,
  Plus,
  Star,
  Key,
  Shield,
  LogOut,
  Mail,
  Palette,
  Lock,
  Users,
  Database,
  Menu,
  X,
  Smartphone,
  Wifi,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface ConsoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function ConsoleSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: ConsoleSidebarProps) {
  const pathname = usePathname();
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [topEntitiesOpen, setTopEntitiesOpen] = useState(true);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const mainNavItems = [
    { name: 'Dashboard', icon: Home, href: '/console/dashboard' },
    { name: 'Organizations', icon: Users, href: '/console/organizations' },
    { name: 'Notifications', icon: Bell, href: '/console/notifications' },
  ];

  const userSettingsItems = [
    { name: 'Profile', icon: User, href: '/console/settings/profile' },
    { name: 'Password', icon: Lock, href: '/console/settings/password' },
    { name: 'Theme', icon: Palette, href: '/console/settings/theme' },
    { name: 'Email notifications', icon: Mail, href: '/console/settings/email-notifications' },
    { name: 'API keys', icon: Key, href: '/console/settings/api-keys' },
    { name: 'Session management', icon: Shield, href: '/console/settings/sessions' },
    { name: 'Authorizations', icon: Shield, href: '/console/settings/authorizations' },
    { name: 'OAuth clients', icon: Users, href: '/console/settings/oauth-clients' },
  ];

  const topEntities = [
    { name: 'Dahi_project', icon: Layers },
    { name: 'RM1', icon: Layers },
    { name: 'WGW23', icon: Radio },
    { name: 'Waarta14', icon: Radio },
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
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
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

        {/* Tab Navigation */}
        {!isCollapsed && (
          <div className="p-2 border-b border-gray-800">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/console/dashboard"
                className={`group relative px-3 py-2 rounded text-sm font-medium text-center overflow-hidden transition-all duration-300 ease-out ${
                  pathname.startsWith('/console/dashboard')
                    ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <span className="relative z-10">Home</span>
                {pathname.startsWith('/console/dashboard') && (
                  <span className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white animate-shimmer" />
                )}
              </Link>
              <Link
                href="/console/applications"
                className={`group relative px-3 py-2 rounded text-sm font-medium text-center overflow-hidden transition-all duration-300 ease-out ${
                  pathname.startsWith('/console/applications')
                    ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <span className="relative z-10">Applications</span>
                {pathname.startsWith('/console/applications') && (
                  <span className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white animate-shimmer" />
                )}
                <span className="absolute inset-0 bg-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
              <Link
                href="/console/gateways"
                className={`group relative px-3 py-2 rounded text-sm font-medium text-center overflow-hidden transition-all duration-300 ease-out ${
                  pathname.startsWith('/console/gateways')
                    ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <span className="relative z-10">Gateways</span>
                {pathname.startsWith('/console/gateways') && (
                  <span className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white animate-shimmer" />
                )}
                <span className="absolute inset-0 bg-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
              <Link
                href="/console/end-devices"
                className={`group relative px-3 py-2 rounded text-sm font-medium text-center overflow-hidden transition-all duration-300 ease-out ${
                  pathname.startsWith('/console/end-devices')
                    ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <span className="relative z-10">End Devices</span>
                {pathname.startsWith('/console/end-devices') && (
                  <span className="absolute inset-0 bg-gradient-to-r from-white via-gray-100 to-white animate-shimmer" />
                )}
                <span className="absolute inset-0 bg-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
              <Link
                href="/console/gsm-devices"
                className={`group relative px-2 py-2 rounded text-xs font-medium text-center flex items-center justify-center gap-1 overflow-hidden transition-all duration-300 ease-out ${
                  pathname.startsWith('/console/gsm-devices')
                    ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <Smartphone className={`h-3.5 w-3.5 transition-transform duration-300 ${pathname.startsWith('/console/gsm-devices') ? '' : 'group-hover:rotate-12'}`} />
                <span className="relative z-10">GSM</span>
                <span className="absolute inset-0 bg-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
              <Link
                href="/console/wifi-devices"
                className={`group relative px-2 py-2 rounded text-xs font-medium text-center flex items-center justify-center gap-1 overflow-hidden transition-all duration-300 ease-out ${
                  pathname.startsWith('/console/wifi-devices')
                    ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <Wifi className={`h-3.5 w-3.5 transition-transform duration-300 ${pathname.startsWith('/console/wifi-devices') ? '' : 'group-hover:scale-110'}`} />
                <span className="relative z-10">Wi-Fi</span>
                <span className="absolute inset-0 bg-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
              <Link
                href="/console/bluetooth-devices"
                className={`group relative px-2 py-2 rounded text-xs font-medium text-center flex items-center justify-center gap-1 overflow-hidden transition-all duration-300 ease-out ${
                  pathname.startsWith('/console/bluetooth-devices')
                    ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md'
                }`}
              >
                <Bluetooth className={`h-3.5 w-3.5 transition-transform duration-300 ${pathname.startsWith('/console/bluetooth-devices') ? '' : 'group-hover:rotate-12'}`} />
                <span className="relative z-10">Bluetooth</span>
                <span className="absolute inset-0 bg-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            </div>
          </div>
        )}

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
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
                  Ctrl
                </kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
                  K
                </kbd>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="p-2">
          {mainNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded text-sm transition-all duration-300 hover:scale-[1.01] ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={`h-4 w-4 transition-transform duration-300 ${isActive(item.href) ? '' : 'group-hover:scale-110'}`} />
              {!isCollapsed && item.name}
            </Link>
          ))}

          {/* User Settings Collapsible */}
          {!isCollapsed && (
            <div className="mt-1">
              <button
                onClick={() => setUserSettingsOpen(!userSettingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4" />
                  User settings
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${
                    userSettingsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {userSettingsOpen && (
                <div className="ml-4 mt-1 space-y-1 animate-fade-in">
                  {userSettingsItems.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all duration-300 hover:scale-[1.01] ${
                        isActive(item.href)
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
              className={`flex items-center justify-center px-3 py-2 rounded text-sm transition-colors mt-1 ${
                pathname.startsWith('/console/settings')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title="User settings"
            >
              <User className="h-4 w-4" />
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
                    className={`h-4 w-4 transition-transform duration-300 ${
                      topEntitiesOpen ? 'rotate-180' : ''
                    }`}
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
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                    Documentation
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                    API Reference
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                    Support
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export function ConsoleLayout({ children }: ConsoleLayoutProps) {
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
        <header className="sticky top-0 z-30 bg-[#1E293B] border-b border-gray-800 h-16">
          <div className="flex items-center justify-between h-full px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumb or page title will go here */}
            <div className="flex-1" />

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Maintenance Status */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-sm">
                <Settings className="h-4 w-4 animate-spin" />
                Maintenance in progress
              </div>

              {/* Add Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">
                    <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                    Add
                    <ChevronDown className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700 w-56 animate-fade-in">
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/applications/new" className="flex items-center">
                      <Layers className="h-4 w-4 mr-2" />
                      Create application
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/end-devices/new" className="flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Add end device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/gateways/new" className="flex items-center">
                      <Radio className="h-4 w-4 mr-2" />
                      Register gateway
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/gsm-devices/new" className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Add GSM device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/wifi-devices/new" className="flex items-center">
                      <Wifi className="h-4 w-4 mr-2" />
                      Add Wi-Fi device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/bluetooth-devices/new" className="flex items-center">
                      <Bluetooth className="h-4 w-4 mr-2" />
                      Add Bluetooth device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/organizations/new" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Create organization
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <Link href="/console/settings/api-keys/new" className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Add API key
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Icon Buttons */}
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95">
                <Star className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
              </Button>
              <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95">
                <Bell className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95">
                <Settings className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-300 hover:scale-110 active:scale-95">
                <Mail className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                        TN
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700 w-48">
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-red-400 hover:bg-gray-800">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
