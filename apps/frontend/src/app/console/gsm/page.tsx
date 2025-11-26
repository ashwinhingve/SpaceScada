'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, MessageSquare, MapPin, Signal, Activity, AlertCircle } from 'lucide-react';
import { gsmAPI } from '@/core/api/endpoints';
import type { GSMDevice } from '@webscada/shared-types';
import { GISDashboard } from '@/components/gis/GISDashboard';

/**
 * GSM Dashboard
 * Overview of GSM devices with SMS, GPS, and network monitoring
 */
export default function GSMDashboard() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    totalMessages: 0,
    activeGPS: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const devices = await gsmAPI.devices.getAll();

      setStats({
        totalDevices: devices.length,
        onlineDevices: devices.filter((d) => d.status === 'ONLINE').length,
        totalMessages: 0, // TODO: Get from API
        activeGPS: devices.filter((d) => d.location).length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Devices',
      value: stats.totalDevices,
      icon: Smartphone,
      href: '/console/gsm/devices',
      description: `${stats.onlineDevices} online`,
      color: 'text-blue-500',
    },
    {
      title: 'SMS Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      href: '#',
      description: 'Total messages sent/received',
      color: 'text-green-500',
    },
    {
      title: 'GPS Tracking',
      value: stats.activeGPS,
      icon: MapPin,
      href: '#',
      description: 'Devices with active GPS',
      color: 'text-purple-500',
    },
    {
      title: 'Network Status',
      value: `${stats.onlineDevices}/${stats.totalDevices}`,
      icon: Signal,
      href: '#',
      description: 'Connected devices',
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">GSM Network</h1>
        <p className="text-gray-400">Monitor and manage your GSM/cellular devices</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <a key={card.title} href={card.href}>
            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{card.title}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{card.value}</div>
                <p className="text-xs text-gray-400 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Device Map - GIS Integration */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-500" />
            Device Locations
          </CardTitle>
          <CardDescription className="text-gray-400">
            Real-time GPS tracking of GSM devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GISDashboard
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            className="h-[400px]"
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Common tasks for managing your GSM devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/console/gsm/devices/new"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Smartphone className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-white font-medium">Add GSM Device</p>
              <p className="text-sm text-gray-400 mt-1">Register a new GSM/cellular device</p>
            </a>

            <a
              href="#"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <MessageSquare className="h-6 w-6 text-green-500 mb-2" />
              <p className="text-white font-medium">Send SMS</p>
              <p className="text-sm text-gray-400 mt-1">Send messages to devices</p>
            </a>

            <a
              href="#"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <MapPin className="h-6 w-6 text-purple-500 mb-2" />
              <p className="text-white font-medium">Track Location</p>
              <p className="text-sm text-gray-400 mt-1">View device GPS positions</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
