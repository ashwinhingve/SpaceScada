'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Trash2, Edit, ExternalLink, Wifi, Key } from 'lucide-react';
import { DeviceList } from '@/features/devices/components/device-list/DeviceList';
import { lorawanAPI } from '@/core/api/endpoints';
import { DeviceStatus } from '@webscada/shared-types';
import type { LoRaWANDevice } from '@/core/api/endpoints';

/**
 * LoRaWAN Devices List Page
 * Displays all LoRaWAN end devices with status and management capabilities
 */
export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<LoRaWANDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await lorawanAPI.devices.getAll();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await lorawanAPI.devices.delete(id);
      setDevices((prev) => prev.filter((dev) => dev.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getActivationModeColor = (mode: string) => {
    return mode === 'OTAA'
      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      : 'bg-purple-500/10 text-purple-500 border-purple-500/20';
  };

  const renderDeviceCard = (
    device: { id: string; name: string },
    onDelete?: (id: string) => void
  ) => {
    const dev = device as LoRaWANDevice;
    return (
      <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {dev.name}
                  <Badge className={getStatusColor(dev.status)}>{dev.status}</Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {dev.description || dev.config?.dev_eui || dev.device_id}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">DevEUI</p>
              <p className="text-white font-mono text-xs">{dev.config?.dev_eui || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Device ID</p>
              <p className="text-white font-medium">{dev.device_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dev.config?.activation_mode && (
              <Badge className={getActivationModeColor(dev.config.activation_mode)}>
                <Key className="h-3 w-3 mr-1" />
                {dev.config.activation_mode}
              </Badge>
            )}
            {dev.config?.device_class && (
              <Badge className="bg-gray-700 text-gray-300 border-gray-600">
                Class: {dev.config.device_class}
              </Badge>
            )}
          </div>

          <div className="text-xs text-gray-400">
            <p>Created: {new Date(dev.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(dev.updated_at).toLocaleDateString()}</p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/lorawan/devices/${dev.id}`)}
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/lorawan/devices/${dev.id}/edit`)}
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
      count: devices.filter((d) => d.status === DeviceStatus.ONLINE).length,
    },
    {
      label: 'Offline',
      value: 'offline',
      count: devices.filter((d) => d.status === DeviceStatus.OFFLINE).length,
    },
    {
      label: 'Provisioning',
      value: 'provisioning',
      count: devices.filter((d) => d.status === DeviceStatus.PROVISIONING).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">LoRaWAN Devices</h1>
          <p className="text-gray-400">Manage your LoRaWAN end devices</p>
        </div>
        <Button
          onClick={() => router.push('/console/lorawan/devices/new')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Device List */}
      <DeviceList
        title="LoRaWAN Devices"
        devices={devices}
        loading={loading}
        error={error}
        renderCard={renderDeviceCard}
        onDelete={handleDelete}
        createHref="/console/lorawan/devices/new"
        filterTabs={filterTabs}
        emptyMessage="No devices found. Add your first LoRaWAN device to start collecting data."
      />
    </div>
  );
}
