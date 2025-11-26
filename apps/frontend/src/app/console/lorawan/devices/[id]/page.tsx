'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Wifi, Database, MapPin, Clock, Activity } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANDevice } from '@webscada/shared-types';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

/**
 * LoRaWAN Device Details Page
 */
export default function LoRaWANDeviceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<LoRaWANDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (deviceId) {
      loadDevice();
    }
  }, [deviceId]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const data = await lorawanAPI.devices.getById(deviceId);
      setDevice(data as LoRaWANDevice);
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
      await lorawanAPI.devices.delete(device.id);
      router.push('/console/lorawan/devices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'ONLINE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive':
      case 'OFFLINE':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'pending':
      case 'PROVISIONING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'error':
      case 'ERROR':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="space-y-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500">{error || 'Device not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
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
            <div className="w-16 h-16 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Database className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{device.name}</h1>
                <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
              </div>
              <p className="text-gray-400">{device.description || device.config?.dev_eui}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/console/lorawan/devices/${device.id}/edit`)}
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

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Activation Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              className={
                device.config?.activation_mode === 'OTAA'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
              }
            >
              {device.config?.activation_mode || 'Unknown'}
            </Badge>
            <p className="text-gray-400 text-sm mt-2">
              {device.config?.activation_mode === 'OTAA'
                ? 'Over-The-Air Activation'
                : 'Activation By Personalization'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Device Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              Class {device.config?.device_class || 'A'}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {device.config?.device_class === 'A'
                ? 'Battery powered'
                : device.config?.device_class === 'B'
                  ? 'Scheduled downlinks'
                  : 'Always listening'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last Seen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
            </div>
            <p className="text-gray-400 text-sm mt-2">Last activity timestamp</p>
          </CardContent>
        </Card>
      </div>

      {/* Device Identifiers */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Device Identifiers</CardTitle>
          <CardDescription className="text-gray-400">
            LoRaWAN device identifiers and keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Device ID</p>
              <p className="text-white font-mono">{device.device_id || device.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">DevEUI</p>
              <p className="text-white font-mono">{device.config?.dev_eui}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">AppEUI</p>
              <p className="text-white font-mono">{device.config?.app_eui}</p>
            </div>
            {device.config?.dev_addr && (
              <div>
                <p className="text-gray-400 text-sm mb-1">DevAddr</p>
                <p className="text-white font-mono">{device.config.dev_addr}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Radio Configuration */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Radio Configuration</CardTitle>
          <CardDescription className="text-gray-400">LoRaWAN radio parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Spreading Factor</p>
              <p className="text-white font-medium">SF{device.config?.spreading_factor || 7}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Bandwidth</p>
              <p className="text-white font-medium">{device.config?.bandwidth || 125} kHz</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Coding Rate</p>
              <p className="text-white font-medium">{device.config?.coding_rate || '4/5'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Frequency Plan</p>
              <p className="text-white font-medium">{device.config?.frequency_plan || 'EU868'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ChirpStack Integration */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">ChirpStack Integration</CardTitle>
          <CardDescription className="text-gray-400">
            ChirpStack application and device profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Application ID</p>
              <p className="text-white font-medium">
                {device.config?.chirpstack_application_id || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Device Profile ID</p>
              <p className="text-white font-medium">
                {device.config?.chirpstack_device_profile_id || 'N/A'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Confirmed Uplinks</p>
            <Badge
              className={
                device.config?.confirmed_uplinks
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }
            >
              {device.config?.confirmed_uplinks ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      {device.status_info && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Status Information</CardTitle>
            <CardDescription className="text-gray-400">
              Real-time device status and link quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Joined</p>
                <Badge
                  className={
                    device.status_info.joined
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }
                >
                  {device.status_info.joined ? 'Yes' : 'No'}
                </Badge>
              </div>
              {device.status_info.rssi !== undefined && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">RSSI</p>
                  <p className="text-white font-medium">{device.status_info.rssi} dBm</p>
                </div>
              )}
              {device.status_info.snr !== undefined && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">SNR</p>
                  <p className="text-white font-medium">{device.status_info.snr} dB</p>
                </div>
              )}
              {device.status_info.gateway_count !== undefined && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Gateways</p>
                  <p className="text-white font-medium">{device.status_info.gateway_count}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Uplink Frame Count</p>
                <p className="text-white font-medium">
                  {device.status_info.uplink_frame_count || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Downlink Frame Count</p>
                <p className="text-white font-medium">
                  {device.status_info.downlink_frame_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location */}
      {device.location && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Latitude</p>
                <p className="text-white font-mono">{device.location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Longitude</p>
                <p className="text-white font-mono">{device.location.longitude.toFixed(6)}</p>
              </div>
              {device.location.altitude && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Altitude</p>
                  <p className="text-white font-mono">{device.location.altitude} m</p>
                </div>
              )}
            </div>
            {device.location.location_name && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Location Name</p>
                <p className="text-white">{device.location.location_name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete LoRaWAN device?"
        description={`Are you sure you want to delete "${device.name}"? This action cannot be undone and will remove all associated data.`}
        itemName={device.name}
      />
    </div>
  );
}
