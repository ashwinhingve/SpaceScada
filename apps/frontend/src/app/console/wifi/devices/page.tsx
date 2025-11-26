'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, Plus, Trash2, Edit, ExternalLink, Signal, Activity } from 'lucide-react';
import { DeviceList } from '@/features/devices/components/device-list/DeviceList';
import { wifiAPI } from '@/core/api/endpoints';
import type { WiFiDevice } from '@webscada/shared-types';

/**
 * Wi-Fi Devices List Page
 * Displays all Wi-Fi devices with management capabilities
 */
export default function WiFiDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<WiFiDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await wifiAPI.devices.getAll();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await wifiAPI.devices.delete(id);
      setDevices((prev) => prev.filter((dev) => dev.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'offline':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getSignalColor = (signal: number) => {
    if (signal >= 70) return 'text-green-500';
    if (signal >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderDeviceCard = (device: { id: string; name: string }, onDelete?: (id: string) => void) => {
    const dev = device as WiFiDevice & {
      mac_address?: string;
      ip_address?: string;
      signal_strength?: number;
      ssid?: string;
      status?: string;
      description?: string;
    };
    return (
      <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {dev.name}
                  <Badge className={getStatusColor(dev.status || 'offline')}>
                    {dev.status || 'offline'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {dev.description || dev.mac_address || dev.config?.mac_address || 'No description'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">MAC Address</p>
              <p className="text-white font-mono text-xs">
                {dev.mac_address || dev.config?.mac_address || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">IP Address</p>
              <p className="text-white font-mono text-xs">
                {dev.ip_address || dev.status_info?.ip_address || 'N/A'}
              </p>
            </div>
          </div>

          {(dev.signal_strength !== undefined || dev.status_info?.signal_strength !== undefined) && (
            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
              <Signal
                className={`h-5 w-5 ${getSignalColor(
                  dev.signal_strength ?? dev.status_info?.signal_strength ?? 0
                )}`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Signal Strength</span>
                  <span
                    className={`text-sm font-medium ${getSignalColor(
                      dev.signal_strength ?? dev.status_info?.signal_strength ?? 0
                    )}`}
                  >
                    {dev.signal_strength ?? dev.status_info?.signal_strength ?? 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (dev.signal_strength ?? dev.status_info?.signal_strength ?? 0) >= 70
                        ? 'bg-green-500'
                        : (dev.signal_strength ?? dev.status_info?.signal_strength ?? 0) >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{
                      width: `${dev.signal_strength ?? dev.status_info?.signal_strength ?? 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              SSID: {dev.ssid || dev.status_info?.ssid || 'Unknown'}
            </Badge>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/wifi/devices/${dev.id}`)}
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/wifi/devices/${dev.id}/edit`)}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(dev.id)}
                className="border-red-500 text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filterTabs = [
    { label: 'All', value: 'all', count: devices.length },
    {
      label: 'Online',
      value: 'online',
      count: devices.filter((d) => {
        const status = (d as any).status;
        return status === 'online' || status === 'ONLINE' || status?.toLowerCase() === 'online';
      }).length,
    },
    {
      label: 'Offline',
      value: 'offline',
      count: devices.filter((d) => {
        const status = (d as any).status;
        return status === 'offline' || status === 'OFFLINE' || status?.toLowerCase() === 'offline';
      }).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wi-Fi Devices</h1>
          <p className="text-gray-400">Manage your Wi-Fi connected devices</p>
        </div>
        <Button
          onClick={() => router.push('/console/wifi/devices/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Wi-Fi Device
        </Button>
      </div>

      {/* Device List */}
      <DeviceList
        title="Wi-Fi Devices"
        devices={devices}
        loading={loading}
        error={error}
        renderCard={renderDeviceCard}
        onDelete={handleDelete}
        createHref="/console/wifi/devices/new"
        filterTabs={filterTabs}
        emptyMessage="No Wi-Fi devices found. Add your first Wi-Fi device to start monitoring network performance."
      />
    </div>
  );
}
