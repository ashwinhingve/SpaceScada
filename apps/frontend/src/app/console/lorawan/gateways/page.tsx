'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Plus, Trash2, Edit, ExternalLink, Activity, Signal, MapPin } from 'lucide-react';
import { DeviceList } from '@/features/devices/components/device-list/DeviceList';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANGateway } from '@/core/api/endpoints';

/**
 * LoRaWAN Gateways List Page
 * Displays all LoRaWAN gateways with status and management capabilities
 */
export default function GatewaysPage() {
  const router = useRouter();
  const [gateways, setGateways] = useState<LoRaWANGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      setLoading(true);
      const data = await lorawanAPI.gateways.getAll();
      setGateways(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gateways');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await lorawanAPI.gateways.delete(id);
      setGateways((prev) => prev.filter((gw) => gw.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gateway');
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

  const renderGatewayCard = (device: { id: string; name: string }, onDelete?: (id: string) => void) => {
    const gateway = device as LoRaWANGateway;
    return (
      <Card className="bg-gray-800 border-gray-700 hover:border-green-500 transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Radio className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {gateway.name}
                  <Badge className={getStatusColor(gateway.status)}>{gateway.status}</Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {gateway.description || gateway.gateway_id}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Gateway ID</p>
              <p className="text-white font-mono text-xs">{gateway.gateway_id}</p>
            </div>
            <div>
              <p className="text-gray-400">Last Seen</p>
              <p className="text-white font-medium">
                {gateway.last_seen ? new Date(gateway.last_seen).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>

          {gateway.location && (
            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <p className="text-white font-medium">
                  {gateway.location.latitude.toFixed(6)}, {gateway.location.longitude.toFixed(6)}
                </p>
                {gateway.location.altitude && (
                  <p className="text-gray-400 text-xs">Altitude: {gateway.location.altitude}m</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/lorawan/gateways/${gateway.id}`)}
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/lorawan/gateways/${gateway.id}/edit`)}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(gateway.id)}
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
    { label: 'All', value: 'all', count: gateways.length },
    {
      label: 'Online',
      value: 'online',
      count: gateways.filter((g) => g.status === 'online').length,
    },
    {
      label: 'Offline',
      value: 'offline',
      count: gateways.filter((g) => g.status === 'offline').length,
    },
    {
      label: 'Error',
      value: 'error',
      count: gateways.filter((g) => g.status === 'error').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">LoRaWAN Gateways</h1>
          <p className="text-gray-400">Monitor and manage your LoRaWAN gateway infrastructure</p>
        </div>
        <Button
          onClick={() => router.push('/console/lorawan/gateways/new')}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Register Gateway
        </Button>
      </div>

      {/* Device List */}
      <DeviceList
        title="LoRaWAN Gateways"
        devices={gateways}
        loading={loading}
        error={error}
        renderCard={renderGatewayCard}
        onDelete={handleDelete}
        createHref="/console/lorawan/gateways/new"
        filterTabs={filterTabs}
        emptyMessage="No gateways found. Register your first LoRaWAN gateway to start receiving data."
      />
    </div>
  );
}
