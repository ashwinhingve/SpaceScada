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
  const [lorawanOpen, setLorawanOpen] = useState(true);

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

  const lorawanItems = [
    { name: 'Applications', icon: Layers, href: '/console/applications' },
    { name: 'Gateways', icon: Radio, href: '/console/gateways' },
    { name: 'End Devices', icon: Database, href: '/console/end-devices' },
  ];

  return (
    <>
      {/* Mobile overlay with smooth fade */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ease-out backdrop-blur-sm"
          onClick={onClose}
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        />
      )}

      {/* Sidebar with improved animations */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#1E293B] border-r border-gray-800 z-50
          transform transition-all duration-300 ease-out overflow-y-auto
          scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900
          ${isCollapsed ? 'w-16' : 'w-72'}
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          lg:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between transition-all duration-300">
          {!isCollapsed && (
            <div className="flex items-center gap-3 transition-opacity duration-300 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-12">
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
            <div className="flex items-center justify-center w-full transition-opacity duration-300 animate-fade-in">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-12">
                <Database className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden lg:block border-b border-gray-800 p-2">
          <button
            onClick={onToggleCollapse}
            className="group w-full flex items-center justify-center px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 hover:scale-[1.02] active:scale-95"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                <span className="transition-opacity duration-200">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-800 transition-all duration-300 animate-fade-in">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-all duration-200 group-focus-within:text-blue-400" />
              <Input
                type="text"
                placeholder="Search"
                className="w-full bg-[#0F172A] border-gray-700 text-gray-300 pl-10 pr-16 h-9 transition-all duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded transition-all duration-200 group-focus-within:bg-gray-700">
                  Ctrl
                </kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-800 text-gray-400 rounded transition-all duration-200 group-focus-within:bg-gray-700">
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
              className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded text-sm
                transition-all duration-200 hover:scale-[1.02] active:scale-95
                ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-4 w-4 transition-transform duration-200 ${isActive(item.href) ? '' : 'group-hover:scale-110'}`}
              />
              {!isCollapsed && <span className="transition-opacity duration-200">{item.name}</span>}
            </Link>
          ))}

          {/* LoRaWAN Dropdown Navigation */}
          {!isCollapsed && (
            <div className="mt-1">
              <button
                onClick={() => setLorawanOpen(!lorawanOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <Radio className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
                  LoRaWAN
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-all duration-300 ${
                    lorawanOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  lorawanOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-4 mt-1 space-y-1">
                  {lorawanItems.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-sm
                        transition-all duration-200 hover:scale-[1.02] active:scale-95
                        ${
                          isActive(item.href)
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                        }`}
                      style={{
                        transitionDelay: lorawanOpen ? `${index * 50}ms` : '0ms',
                      }}
                    >
                      <item.icon className="h-3.5 w-3.5 transition-transform duration-200 hover:scale-110" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <Link
              href="/console/applications"
              className={`flex items-center justify-center px-3 py-2 rounded text-sm transition-all duration-200 mt-1 hover:scale-[1.02] active:scale-95 ${
                pathname.startsWith('/console/applications') ||
                pathname.startsWith('/console/gateways') ||
                pathname.startsWith('/console/end-devices')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title="LoRaWAN"
            >
              <Radio className="h-4 w-4" />
            </Link>
          )}

          {/* Protocol Devices Section */}
          {!isCollapsed && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Protocol Devices
              </div>
              <div className="space-y-1 mt-2">
                <Link
                  href="/console/gsm/devices"
                  className={`group flex items-center gap-3 px-3 py-2 rounded text-sm
                    transition-all duration-200 hover:scale-[1.02] active:scale-95
                    ${
                      isActive('/console/gsm')
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Smartphone
                    className={`h-4 w-4 transition-transform duration-200 ${isActive('/console/gsm') ? '' : 'group-hover:rotate-12'}`}
                  />
                  GSM Devices
                </Link>
                <Link
                  href="/console/wifi/devices"
                  className={`group flex items-center gap-3 px-3 py-2 rounded text-sm
                    transition-all duration-200 hover:scale-[1.02] active:scale-95
                    ${
                      isActive('/console/wifi')
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Wifi
                    className={`h-4 w-4 transition-transform duration-200 ${isActive('/console/wifi') ? '' : 'group-hover:scale-110'}`}
                  />
                  Wi-Fi Devices
                </Link>
                <Link
                  href="/console/bluetooth/devices"
                  className={`group flex items-center gap-3 px-3 py-2 rounded text-sm
                    transition-all duration-200 hover:scale-[1.02] active:scale-95
                    ${
                      isActive('/console/bluetooth')
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <Bluetooth
                    className={`h-4 w-4 transition-transform duration-200 ${isActive('/console/bluetooth') ? '' : 'group-hover:rotate-12'}`}
                  />
                  Bluetooth Devices
                </Link>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-1">
              <Link
                href="/console/gsm/devices"
                className={`flex items-center justify-center px-3 py-2 rounded text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  isActive('/console/gsm')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title="GSM Devices"
              >
                <Smartphone className="h-4 w-4" />
              </Link>
              <Link
                href="/console/wifi/devices"
                className={`flex items-center justify-center px-3 py-2 rounded text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  isActive('/console/wifi')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title="Wi-Fi Devices"
              >
                <Wifi className="h-4 w-4" />
              </Link>
              <Link
                href="/console/bluetooth/devices"
                className={`flex items-center justify-center px-3 py-2 rounded text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  isActive('/console/bluetooth')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title="Bluetooth Devices"
              >
                <Bluetooth className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* User Settings Collapsible */}
          {!isCollapsed && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <button
                onClick={() => setUserSettingsOpen(!userSettingsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4" />
                  User settings
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-all duration-300 ${
                    userSettingsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  userSettingsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-4 mt-1 space-y-1">
                  {userSettingsItems.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-sm
                        transition-all duration-200 hover:scale-[1.02] active:scale-95
                        ${
                          isActive(item.href)
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                        }`}
                      style={{
                        transitionDelay: userSettingsOpen ? `${index * 30}ms` : '0ms',
                      }}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <Link
                href="/console/settings/profile"
                className={`flex items-center justify-center px-3 py-2 rounded text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                  pathname.startsWith('/console/settings')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title="User settings"
              >
                <User className="h-4 w-4" />
              </Link>
            </div>
          )}
        </nav>

        {/* Resources (moved to bottom) */}
        {!isCollapsed && (
          <div className="mt-auto border-t border-gray-800 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-all duration-200 hover:scale-[1.02] active:scale-95">
                  <Database className="h-4 w-4" />
                  Resources
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#1E293B] border-gray-700">
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                  Documentation
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                  API Reference
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                  Support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Custom animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `,
        }}
      />
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
      <div
        className={`transition-all duration-300 ease-out ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'}`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#1E293B] border-b border-gray-800 h-16">
          <div className="flex items-center justify-between h-full px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumb or page title will go here */}
            <div className="flex-1" />

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              {/* Maintenance Status */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-sm transition-all duration-200 hover:bg-blue-500/20">
                <Settings className="h-4 w-4 animate-spin" />
                Maintenance in progress
              </div>

              {/* Add Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700 w-56">
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/lorawan/applications/new" className="flex items-center">
                      <Layers className="h-4 w-4 mr-2" />
                      Create application
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/lorawan/devices/new" className="flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Add end device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/lorawan/gateways/new" className="flex items-center">
                      <Radio className="h-4 w-4 mr-2" />
                      Register gateway
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/gsm/devices/new" className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Add GSM device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/wifi/devices/new" className="flex items-center">
                      <Wifi className="h-4 w-4 mr-2" />
                      Add Wi-Fi device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/bluetooth/devices/new" className="flex items-center">
                      <Bluetooth className="h-4 w-4 mr-2" />
                      Add Bluetooth device
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/organizations/new" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Create organization
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                  >
                    <Link href="/console/settings/api-keys/new" className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Add API key
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Icon Buttons */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Star className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Mail className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium transition-all duration-200 hover:scale-110">
                        TN
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700 w-48">
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 transition-all duration-200 cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem className="text-red-400 hover:bg-gray-800 transition-all duration-200 cursor-pointer">
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
