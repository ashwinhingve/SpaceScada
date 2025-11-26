'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Radio, Database, Activity, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANApplication, LoRaWANGateway, LoRaWANDevice } from '@/core/api/endpoints';
import { GISDashboard } from '@/components/gis/GISDashboard';

/**
 * LoRaWAN Dashboard
 * Overview of LoRaWAN network status, applications, gateways, and devices
 */
export default function LoRaWANDashboard() {
  const [stats, setStats] = useState({
    applications: 0,
    gateways: 0,
    devices: 0,
    onlineGateways: 0,
    activeDevices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [applications, gateways, devices] = await Promise.all([
        lorawanAPI.applications.getAll(),
        lorawanAPI.gateways.getAll(),
        lorawanAPI.devices.getAll(),
      ]);

      setStats({
        applications: applications.length,
        gateways: gateways.length,
        devices: devices.length,
        onlineGateways: gateways.filter((g) => g.status === 'online').length,
        activeDevices: devices.filter((d) => d.status === 'active').length,
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
      title: 'Applications',
      value: stats.applications,
      icon: Layers,
      href: '/console/lorawan/applications',
      description: 'Total LoRaWAN applications',
      color: 'text-blue-500',
    },
    {
      title: 'Gateways',
      value: stats.gateways,
      icon: Radio,
      href: '/console/lorawan/gateways',
      description: `${stats.onlineGateways} online`,
      color: 'text-green-500',
    },
    {
      title: 'Devices',
      value: stats.devices,
      icon: Database,
      href: '/console/lorawan/devices',
      description: `${stats.activeDevices} active`,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">LoRaWAN Network</h1>
        <p className="text-gray-400">Monitor and manage your LoRaWAN infrastructure</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            Gateway & Device Locations
          </CardTitle>
          <CardDescription className="text-gray-400">
            Real-time location tracking of LoRaWAN gateways and devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GISDashboard
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            className="h-[400px]"
          />
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Network Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Current status of your LoRaWAN network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-white font-medium">Network Server</p>
                <p className="text-sm text-gray-400">ChirpStack running</p>
              </div>
            </div>
            <span className="text-green-500 text-sm font-medium">Online</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-white font-medium">Gateway Bridge</p>
                <p className="text-sm text-gray-400">MQTT connection active</p>
              </div>
            </div>
            <span className="text-green-500 text-sm font-medium">Connected</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-400">Gateway Uptime</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.gateways > 0
                  ? `${Math.round((stats.onlineGateways / stats.gateways) * 100)}%`
                  : '0%'}
              </p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-400">Device Activity</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.devices > 0
                  ? `${Math.round((stats.activeDevices / stats.devices) * 100)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Common tasks for managing your LoRaWAN network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/console/lorawan/applications/new"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Layers className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-white font-medium">Create Application</p>
              <p className="text-sm text-gray-400 mt-1">Set up a new LoRaWAN application</p>
            </a>

            <a
              href="/console/lorawan/gateways/new"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Radio className="h-6 w-6 text-green-500 mb-2" />
              <p className="text-white font-medium">Register Gateway</p>
              <p className="text-sm text-gray-400 mt-1">Add a new gateway to your network</p>
            </a>

            <a
              href="/console/lorawan/devices/new"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Database className="h-6 w-6 text-purple-500 mb-2" />
              <p className="text-white font-medium">Add Device</p>
              <p className="text-sm text-gray-400 mt-1">Register a new end device</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
