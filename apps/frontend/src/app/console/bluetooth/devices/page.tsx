'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, Plus, Trash2, Edit, ExternalLink, Signal, Battery, Activity } from 'lucide-react';
import { DeviceList } from '@/features/devices/components/device-list/DeviceList';
import { bluetoothAPI } from '@/core/api/endpoints';
import type { BluetoothDevice } from '@webscada/shared-types';

/**
 * Bluetooth Devices List Page
 * Displays all Bluetooth devices with management capabilities
 */
export default function BluetoothDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await bluetoothAPI.devices.getAll();
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      await bluetoothAPI.devices.delete(id);
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

  const getBatteryColor = (level: number) => {
    if (level >= 70) return 'text-green-500';
    if (level >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSignalColor = (signal: number) => {
    if (signal >= 70) return 'text-green-500';
    if (signal >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderDeviceCard = (device: BluetoothDevice, onDelete: (id: string) => void) => (
    <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bluetooth className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                {device.name}
                <Badge className={getStatusColor(device.status || 'offline')}>
                  {device.status || 'offline'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">
                {device.description || device.config?.mac_address || 'No description'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">MAC Address</p>
            <p className="text-white font-mono text-xs">{device.config?.mac_address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400">Protocol</p>
            <p className="text-white uppercase text-xs">{device.config?.protocol || 'N/A'}</p>
          </div>
        </div>

        {/* Battery Level */}
        {device.status_info?.battery_level !== undefined && (
          <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
            <Battery className={`h-5 w-5 ${getBatteryColor(device.status_info.battery_level)}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Battery Level</span>
                <span className={`text-sm font-medium ${getBatteryColor(device.status_info.battery_level)}`}>
                  {device.status_info.battery_level}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    device.status_info.battery_level >= 70
                      ? 'bg-green-500'
                      : device.status_info.battery_level >= 30
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${device.status_info.battery_level}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Signal Strength */}
        {device.status_info?.signal_strength !== undefined && (
          <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
            <Signal className={`h-5 w-5 ${getSignalColor(device.status_info.signal_strength)}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Signal Strength</span>
                <span className={`text-sm font-medium ${getSignalColor(device.status_info.signal_strength)}`}>
                  {device.status_info.signal_strength}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    device.status_info.signal_strength >= 70
                      ? 'bg-green-500'
                      : device.status_info.signal_strength >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${device.status_info.signal_strength}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {device.config?.protocol && (
            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
              {device.config.protocol.toUpperCase()}
            </Badge>
          )}
          {device.status_info?.rssi && (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
              RSSI: {device.status_info.rssi} dBm
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/console/bluetooth/devices/${device.id}`)}
            className="flex-1 border-gray-600 hover:bg-gray-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/console/bluetooth/devices/${device.id}/edit`)}
            className="border-gray-600 hover:bg-gray-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(device.id)}
            className="border-red-600 text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bluetooth Devices</h1>
          <p className="text-gray-400">Manage your Bluetooth and BLE devices</p>
        </div>
        <Button
          onClick={() => router.push('/console/bluetooth/devices/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Devices</p>
                <p className="text-2xl font-bold text-white">{devices.length}</p>
              </div>
              <Bluetooth className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Online</p>
                <p className="text-2xl font-bold text-white">
                  {devices.filter((d) => d.status === 'ONLINE').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">BLE Devices</p>
                <p className="text-2xl font-bold text-white">
                  {devices.filter((d) => d.config?.protocol === 'BLE').length}
                </p>
              </div>
              <Signal className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Low Battery</p>
                <p className="text-2xl font-bold text-white">
                  {devices.filter((d) => (d.status_info?.battery_level || 0) < 20).length}
                </p>
              </div>
              <Battery className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Devices List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : devices.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bluetooth className="h-16 w-16 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-4">No Bluetooth devices found</p>
            <Button
              onClick={() => router.push('/console/bluetooth/devices/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Device
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div key={device.id}>{renderDeviceCard(device, handleDelete)}</div>
          ))}
        </div>
      )}
    </div>
  );
}
