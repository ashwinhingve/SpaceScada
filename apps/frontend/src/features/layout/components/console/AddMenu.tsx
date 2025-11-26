'use client';

import React from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronDown,
  Layers,
  Database,
  Radio,
  Smartphone,
  Wifi,
  Bluetooth,
  Users,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * AddMenu - Dropdown menu for creating new entities
 * Will be updated to use new routes once migration is complete
 */
export function AddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">
          <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
          Add
          <ChevronDown className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:rotate-180" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="bg-[#1E293B] border-gray-700 w-56 animate-fade-in">
        {/* LoRaWAN Items */}
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

        {/* Device Items */}
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

        {/* Other Items */}
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
  );
}
