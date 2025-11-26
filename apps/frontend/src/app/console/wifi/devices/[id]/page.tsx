'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Wifi, Activity, Signal } from 'lucide-react';
import { wifiAPI } from '@/core/api/endpoints';
import type { WiFiDevice } from '@webscada/shared-types';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function WiFiDeviceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<WiFiDevice | null>(null);
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
      const data = await wifiAPI.devices.getById(deviceId);
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
      await wifiAPI.devices.delete(device.id);
      router.push('/console/wifi/devices');
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
    const s = status?.toLowerCase();
    if (s === 'online') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (s === 'offline') return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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
              <Wifi className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{device.name}</h1>
                <Badge className={getStatusColor(device.status || 'offline')}>
                  {device.status || 'offline'}
                </Badge>
              </div>
              <p className="text-gray-400">{device.description || device.config?.mac_address}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/console/wifi/devices/${device.id}/edit`)}
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
              <Signal className="h-4 w-4" />
              Signal Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {device.status_info?.signal_strength || 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">SSID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {device.config?.ssid || device.status_info?.ssid || 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium">IP Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {device.status_info?.ip_address || 'N/A'}
            </div>
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
              <p className="text-gray-400 text-sm mb-1">Chipset</p>
              <p className="text-white">{device.config?.chipset}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">DHCP</p>
              <Badge
                className={
                  device.config?.use_dhcp
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }
              >
                {device.config?.use_dhcp ? 'Enabled' : 'Static IP'}
              </Badge>
            </div>
            {!device.config?.use_dhcp && device.config?.static_ip && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Static IP</p>
                <p className="text-white font-mono">{device.config.static_ip}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {device.config?.mqtt_enabled && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">MQTT Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Broker Host</p>
                <p className="text-white font-mono">{device.config.mqtt_broker_host || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Port</p>
                <p className="text-white">{device.config.mqtt_broker_port || 'N/A'}</p>
              </div>
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
        title="Delete Wi-Fi device?"
        description={`Are you sure you want to delete "${device.name}"? This action cannot be undone.`}
        itemName={device.name}
      />
    </div>
  );
}
