'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Bluetooth, Activity, Battery, Signal } from 'lucide-react';
import { bluetoothAPI } from '@/core/api/endpoints';
import type { BluetoothDevice } from '@webscada/shared-types';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function BluetoothDeviceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (deviceId) loadDevice();
  }, [deviceId]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const data = await bluetoothAPI.devices.getById(deviceId);
      setDevice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!device) return;
    try {
      setDeleting(true);
      await bluetoothAPI.devices.delete(device.id);
      router.push('/console/bluetooth/devices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <p className="text-red-500">{error || 'Device not found'}</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'ONLINE') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (s === 'OFFLINE') return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="border-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bluetooth className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{device.name}</h1>
                <Badge className={getStatusColor(device.status || 'OFFLINE')}>
                  {device.status || 'OFFLINE'}
                </Badge>
              </div>
              <p className="text-gray-400">{device.description || device.config?.mac_address}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/console/bluetooth/devices/${device.id}/edit`)}
            className="border-gray-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Battery Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {device.status_info?.battery_level || 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Signal className="h-4 w-4" />
              Signal Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {device.status_info?.signal_strength || 0}%
            </div>
            {device.status_info?.rssi && (
              <p className="text-gray-400 text-sm mt-2">{device.status_info.rssi} dBm</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">Protocol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{device.config?.protocol || 'BLE'}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Device Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">MAC Address</p>
              <p className="text-white font-mono">{device.config?.mac_address}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Protocol</p>
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                {device.config?.protocol?.toUpperCase() || 'BLE'}
              </Badge>
            </div>
            {device.config?.device_name && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Device Name</p>
                <p className="text-white">{device.config.device_name}</p>
              </div>
            )}
            {device.config?.manufacturer && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Manufacturer</p>
                <p className="text-white">{device.config.manufacturer}</p>
              </div>
            )}
            {device.config?.model_number && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Model Number</p>
                <p className="text-white">{device.config.model_number}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {device.status_info && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Status Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {device.status_info.advertising !== undefined && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Advertising</p>
                  <Badge
                    className={
                      device.status_info.advertising
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }
                  >
                    {device.status_info.advertising ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}
              {device.status_info.bonded !== undefined && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Bonded</p>
                  <Badge
                    className={
                      device.status_info.bonded
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }
                  >
                    {device.status_info.bonded ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}
              {device.status_info.encrypted !== undefined && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Encrypted</p>
                  <Badge
                    className={
                      device.status_info.encrypted
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }
                  >
                    {device.status_info.encrypted ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}
              {device.status_info.distance_estimate !== undefined && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Distance</p>
                  <p className="text-white">{device.status_info.distance_estimate.toFixed(2)} m</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Created At</p>
              <p className="text-white">{new Date(device.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Updated At</p>
              <p className="text-white">{new Date(device.updated_at).toLocaleString()}</p>
            </div>
          </div>
          {device.tags && device.tags.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {device.tags.map((tag, index) => (
                  <Badge key={index} className="bg-gray-700 text-gray-300 border-gray-600">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Bluetooth device?"
        description={`Are you sure you want to delete "${device.name}"? This action cannot be undone.`}
        itemName={device.name}
      />
    </div>
  );
}
