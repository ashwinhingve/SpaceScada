'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Radio, Activity, MapPin, Signal, Clock } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANGateway } from '@/core/api/endpoints/lorawan.api';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function LoRaWANGatewayDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const gatewayId = params?.id as string;

  const [gateway, setGateway] = useState<LoRaWANGateway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (gatewayId) loadGateway();
  }, [gatewayId]);

  const loadGateway = async () => {
    try {
      setLoading(true);
      const data = await lorawanAPI.gateways.getById(gatewayId);
      setGateway(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!gateway) return;
    try {
      setDeleting(true);
      await lorawanAPI.gateways.delete(gateway.id);
      router.push('/console/lorawan/gateways');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gateway');
      setDeleting(false);
      setDeleteDialogOpen(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error || !gateway) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <p className="text-red-500">{error || 'Gateway not found'}</p>
        </CardContent>
      </Card>
    );
  }

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
            <div className="w-16 h-16 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Radio className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{gateway.name}</h1>
                <Badge className={getStatusColor(gateway.status)}>
                  {gateway.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-gray-400">{gateway.description || gateway.gateway_id}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/console/lorawan/gateways/${gateway.id}/edit`)}
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
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white capitalize">{gateway.status}</div>
            <p className="text-gray-400 text-sm mt-2">Gateway connection state</p>
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
              {gateway.last_seen ? new Date(gateway.last_seen).toLocaleTimeString() : 'Never'}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {gateway.last_seen
                ? new Date(gateway.last_seen).toLocaleDateString()
                : 'Not connected yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Registered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Date(gateway.created_at).toLocaleDateString()}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {new Date(gateway.created_at).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Gateway Identification</CardTitle>
          <CardDescription className="text-gray-400">
            Unique identifiers for this LoRaWAN gateway
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Gateway ID (EUI-64)</p>
              <p className="text-white font-mono text-lg">{gateway.gateway_id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Internal ID</p>
              <p className="text-white font-mono text-sm">{gateway.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {gateway.location && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gateway Location
            </CardTitle>
            <CardDescription className="text-gray-400">
              Physical coordinates of the gateway installation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Latitude</p>
                <p className="text-white font-mono text-lg">
                  {gateway.location.latitude.toFixed(6)}°
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Longitude</p>
                <p className="text-white font-mono text-lg">
                  {gateway.location.longitude.toFixed(6)}°
                </p>
              </div>
              {gateway.location.altitude && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Altitude</p>
                  <p className="text-white font-mono text-lg">{gateway.location.altitude} m</p>
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Coordinates: {gateway.location.latitude.toFixed(6)},{' '}
                {gateway.location.longitude.toFixed(6)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!gateway.location && (
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">Location Not Set</p>
                <p className="text-sm text-gray-400">
                  This gateway does not have location information. Adding accurate location
                  coordinates can help with network coverage planning and device troubleshooting.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/console/lorawan/gateways/${gateway.id}/edit`)}
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                  >
                    Add Location
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-green-500/5 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Radio className="h-4 w-4 text-green-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Gateway Configuration</p>
              <p className="text-sm text-gray-400">
                To connect your physical gateway to this network, configure it with the following
                Gateway ID: <span className="font-mono text-white">{gateway.gateway_id}</span>.
                Ensure your gateway is configured to use the correct network server address and has
                valid authentication credentials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete LoRaWAN Gateway?"
        description={`Are you sure you want to delete "${gateway.name}"? This action cannot be undone and may affect device connectivity.`}
        itemName={gateway.name}
      />
    </div>
  );
}
