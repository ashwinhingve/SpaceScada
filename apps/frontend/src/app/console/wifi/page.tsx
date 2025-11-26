'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Signal, Activity, AlertCircle, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { wifiAPI } from '@/core/api/endpoints';
import type { WiFiDevice } from '@webscada/shared-types';
import { GISDashboard } from '@/components/gis/GISDashboard';

/**
 * Wi-Fi Dashboard
 * Overview of Wi-Fi devices with network monitoring and statistics
 */
export default function WiFiDashboard() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    weakSignal: 0,
    averageSignal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const devices = await wifiAPI.devices.getAll();
      const weakSignalDevices = await wifiAPI.devices.getWeakSignal(30);

      const totalSignal = devices.reduce(
        (sum, d) => sum + ((d as any).signal_strength ?? (d as any).status_info?.signal_strength ?? 0),
        0
      );
      const avgSignal = devices.length > 0 ? Math.round(totalSignal / devices.length) : 0;

      setStats({
        totalDevices: devices.length,
        onlineDevices: devices.filter((d) => {
          const status = (d as any).status;
          return status === 'online' || status === 'ONLINE' || status?.toLowerCase() === 'online';
        }).length,
        weakSignal: weakSignalDevices.length,
        averageSignal: avgSignal,
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
      icon: Wifi,
      href: '/console/wifi/devices',
      description: `${stats.onlineDevices} online`,
      color: 'text-blue-500',
    },
    {
      title: 'Average Signal',
      value: `${stats.averageSignal}%`,
      icon: Signal,
      href: '#',
      description: 'Network-wide average',
      color: stats.averageSignal > 70 ? 'text-green-500' : 'text-yellow-500',
    },
    {
      title: 'Weak Signal',
      value: stats.weakSignal,
      icon: AlertCircle,
      href: '#',
      description: 'Devices below 30%',
      color: 'text-red-500',
    },
    {
      title: 'Network Health',
      value: `${stats.onlineDevices}/${stats.totalDevices}`,
      icon: Activity,
      href: '#',
      description: 'Connected devices',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Wi-Fi Network</h1>
        <p className="text-gray-400">Monitor and manage your Wi-Fi connected devices</p>
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
            <MapPin className="h-5 w-5 text-blue-500" />
            Device Locations
          </CardTitle>
          <CardDescription className="text-gray-400">
            Real-time location tracking of Wi-Fi devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GISDashboard
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            className="h-[400px]"
          />
        </CardContent>
      </Card>

      {/* Signal Strength Distribution */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Signal className="h-5 w-5 text-blue-500" />
            Signal Strength Distribution
          </CardTitle>
          <CardDescription className="text-gray-400">
            Network signal quality across all devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg h-[300px] flex items-center justify-center">
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Network Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Bandwidth Usage
            </CardTitle>
            <CardDescription className="text-gray-400">Network traffic overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg h-[200px] flex items-center justify-center">
              <p className="text-gray-500">Bandwidth chart coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Device Activity
            </CardTitle>
            <CardDescription className="text-gray-400">Connection status over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg h-[200px] flex items-center justify-center">
              <p className="text-gray-500">Activity chart coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Common tasks for managing your Wi-Fi devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/console/wifi/devices/new"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Wifi className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-white font-medium">Add Wi-Fi Device</p>
              <p className="text-sm text-gray-400 mt-1">Register a new Wi-Fi device</p>
            </a>

            <a
              href="#"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Signal className="h-6 w-6 text-green-500 mb-2" />
              <p className="text-white font-medium">Signal Analysis</p>
              <p className="text-sm text-gray-400 mt-1">Analyze network signal strength</p>
            </a>

            <a
              href="#"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
              <p className="text-white font-medium">Weak Signal Alerts</p>
              <p className="text-sm text-gray-400 mt-1">View devices with poor signal</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
