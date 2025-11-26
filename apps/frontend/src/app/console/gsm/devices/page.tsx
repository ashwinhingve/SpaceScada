'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Plus, Trash2, Edit, ExternalLink, MessageSquare, MapPin, Signal } from 'lucide-react';
import { DeviceList } from '@/features/devices/components/device-list/DeviceList';
import { gsmAPI } from '@/core/api/endpoints';
import type { GSMDevice } from '@webscada/shared-types';

/**
 * GSM Devices List Page
 * Displays all GSM devices with management capabilities
 */
export default function GSMDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<GSMDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await gsmAPI.devices.getAll();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await gsmAPI.devices.delete(id);
      setDevices((prev) => prev.filter((dev) => dev.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    }
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'ONLINE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'OFFLINE':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'ERROR':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const renderDeviceCard = (device: GSMDevice, onDelete?: (id: string) => void) => (
    <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                {device.name}
                <Badge className={getStatusColor(device.status || 'offline')}>
                  {device.status || 'offline'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">
                {device.description || device.config?.imei || 'No description'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">ICCID</p>
            <p className="text-white font-medium">{device.config?.iccid || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400">IMEI</p>
            <p className="text-white font-mono text-xs">{device.config?.imei || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {device.config?.apn && (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
              APN: {device.config.apn}
            </Badge>
          )}
          {device.status_info?.network_type && (
            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
              {device.status_info.network_type}
            </Badge>
          )}
          {device.status_info && device.status_info.signal_strength !== undefined && (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              <Signal className="h-3 w-3 mr-1" />
              {device.status_info.signal_strength}%
            </Badge>
          )}
        </div>

        {device.location && (
          <div className="text-xs text-gray-400">
            <p>
              Location: {device.location.latitude.toFixed(6)}, {device.location.longitude.toFixed(6)}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/console/gsm/devices/${device.id}`)}
            className="flex-1 border-gray-600 hover:bg-gray-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/console/gsm/devices/${device.id}/edit`)}
            className="border-gray-600 hover:bg-gray-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete?.(device.id)}
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const filterTabs = [
    { label: 'All', value: 'all', count: devices.length },
    {
      label: 'Online',
      value: 'online',
      count: devices.filter((d) => d.status === 'ONLINE').length,
    },
    {
      label: 'Offline',
      value: 'offline',
      count: devices.filter((d) => d.status === 'OFFLINE').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">GSM Devices</h1>
          <p className="text-gray-400">Manage your GSM/cellular devices</p>
        </div>
        <Button
          onClick={() => router.push('/console/gsm/devices/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add GSM Device
        </Button>
      </div>

      {/* Device List */}
      <DeviceList<GSMDevice>
        title="GSM Devices"
        devices={devices}
        loading={loading}
        error={error}
        renderCard={renderDeviceCard}
        onDelete={handleDelete}
        createHref="/console/gsm/devices/new"
        filterTabs={filterTabs}
        emptyMessage="No GSM devices found. Add your first GSM device to start tracking and monitoring."
      />
    </div>
  );
}
