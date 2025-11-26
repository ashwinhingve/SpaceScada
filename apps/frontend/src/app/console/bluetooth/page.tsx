'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bluetooth, Battery, Signal, Activity, AlertCircle, MapPin } from 'lucide-react';
import { bluetoothAPI } from '@/core/api/endpoints';
import type { BluetoothDevice } from '@webscada/shared-types';
import { GISDashboard } from '@/components/gis/GISDashboard';

/**
 * Bluetooth Dashboard
 * Overview of Bluetooth devices with BLE, proximity monitoring, and battery tracking
 */
export default function BluetoothDashboard() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    lowBattery: 0,
    bleDevices: 0,
    averageBattery: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [devices, lowBatteryDevices] = await Promise.all([
        bluetoothAPI.devices.getAll(),
        bluetoothAPI.battery.getLowBattery(20),
      ]);

      const bleDevices = devices.filter((d) => d.config?.protocol === 'BLE');
      const totalBattery = devices.reduce((sum, d) => sum + (d.status_info?.battery_level || 0), 0);
      const avgBattery = devices.length > 0 ? Math.round(totalBattery / devices.length) : 0;

      setStats({
        totalDevices: devices.length,
        onlineDevices: devices.filter((d) => d.status === 'ONLINE').length,
        lowBattery: lowBatteryDevices.length,
        bleDevices: bleDevices.length,
        averageBattery: avgBattery,
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
      icon: Bluetooth,
      href: '/console/bluetooth/devices',
      description: `${stats.onlineDevices} online`,
      color: 'text-blue-500',
    },
    {
      title: 'BLE Devices',
      value: stats.bleDevices,
      icon: Signal,
      href: '/console/bluetooth/devices',
      description: 'Bluetooth Low Energy',
      color: 'text-purple-500',
    },
    {
      title: 'Low Battery',
      value: stats.lowBattery,
      icon: Battery,
      href: '#',
      description: 'Devices below 20%',
      color: stats.lowBattery > 0 ? 'text-red-500' : 'text-green-500',
    },
    {
      title: 'Avg Battery',
      value: `${stats.averageBattery}%`,
      icon: Activity,
      href: '#',
      description: 'Network-wide average',
      color: stats.averageBattery > 50 ? 'text-green-500' : 'text-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Bluetooth Network</h1>
        <p className="text-gray-400">Monitor and manage your Bluetooth and BLE devices</p>
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
            Real-time location and proximity tracking of Bluetooth devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GISDashboard
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            className="h-[400px]"
          />
        </CardContent>
      </Card>

      {/* Battery Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Battery className="h-5 w-5 text-green-500" />
              Battery Health
            </CardTitle>
            <CardDescription className="text-gray-400">
              Device battery status distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-300">Good (80-100%)</span>
                </div>
                <span className="text-white font-medium">
                  {stats.totalDevices > 0 ? Math.round(((stats.totalDevices - stats.lowBattery) / stats.totalDevices) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-gray-300">Medium (20-79%)</span>
                </div>
                <span className="text-white font-medium">--</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-300">Low (&lt;20%)</span>
                </div>
                <span className="text-white font-medium">{stats.lowBattery}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Signal className="h-5 w-5 text-purple-500" />
              Connection Status
            </CardTitle>
            <CardDescription className="text-gray-400">Device connectivity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-300">Connected</span>
                </div>
                <span className="text-white font-medium">{stats.onlineDevices}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-gray-300">Disconnected</span>
                </div>
                <span className="text-white font-medium">{stats.totalDevices - stats.onlineDevices}</span>
              </div>
              <div className="p-3 bg-gray-900 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Connection Rate</span>
                  <span className="text-white font-medium">
                    {stats.totalDevices > 0 ? Math.round((stats.onlineDevices / stats.totalDevices) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.totalDevices > 0 ? (stats.onlineDevices / stats.totalDevices) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Common tasks for managing your Bluetooth devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/console/bluetooth/devices/new"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Bluetooth className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-white font-medium">Add Bluetooth Device</p>
              <p className="text-sm text-gray-400 mt-1">Register a new Bluetooth/BLE device</p>
            </a>

            <a
              href="#"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Battery className="h-6 w-6 text-green-500 mb-2" />
              <p className="text-white font-medium">Battery Monitor</p>
              <p className="text-sm text-gray-400 mt-1">Track device battery levels</p>
            </a>

            <a
              href="#"
              className="p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors cursor-pointer"
            >
              <Signal className="h-6 w-6 text-purple-500 mb-2" />
              <p className="text-white font-medium">Proximity Tracking</p>
              <p className="text-sm text-gray-400 mt-1">Monitor device proximity zones</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
