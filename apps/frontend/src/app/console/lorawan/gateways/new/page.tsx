'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Radio } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';

export default function NewLoRaWANGatewayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gatewayId, setGatewayId] = useState('');

  // Location
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Gateway name is required');
      return;
    }
    if (!gatewayId.trim()) {
      setError('Gateway ID is required');
      return;
    }
    if (gatewayId.length !== 16) {
      setError('Gateway ID must be 16 characters (8 bytes in hex)');
      return;
    }

    try {
      setLoading(true);

      const gatewayData: any = {
        name,
        description: description || undefined,
        gateway_id: gatewayId,
        location:
          latitude && longitude
            ? {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                altitude: altitude ? parseFloat(altitude) : undefined,
              }
            : undefined,
        status: 'offline',
      };

      await lorawanAPI.gateways.create(gatewayData);
      router.push('/console/lorawan/gateways');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gateway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white">Register LoRaWAN Gateway</h1>
            <p className="text-gray-400">Add a new LoRaWAN gateway to your network</p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Gateway Information</CardTitle>
            <CardDescription className="text-gray-400">
              Basic information about your LoRaWAN gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Gateway Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Gateway Building A"
                className="bg-gray-900 border-gray-700 text-white"
                required
              />
              <p className="text-sm text-gray-500">A friendly name to identify this gateway</p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Gateway ID (EUI-64) *</Label>
              <Input
                value={gatewayId}
                onChange={(e) => setGatewayId(e.target.value.toLowerCase())}
                placeholder="0000000000000000"
                maxLength={16}
                className="bg-gray-900 border-gray-700 text-white font-mono"
                required
              />
              <p className="text-sm text-gray-500">
                16 character hexadecimal ID (8 bytes) - typically found on the gateway hardware
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the location and purpose of this gateway"
                className="bg-gray-900 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Location (Optional)</CardTitle>
            <CardDescription className="text-gray-400">
              Physical location coordinates of the gateway for coverage mapping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="40.7128"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-74.0060"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Altitude (m)</Label>
                <Input
                  type="number"
                  step="any"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  placeholder="10"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Accurate location data helps with network planning and device troubleshooting
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Radio className="h-4 w-4 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">About LoRaWAN Gateways</p>
                <p className="text-sm text-gray-400">
                  LoRaWAN gateways act as transparent bridges between end-devices and the network
                  server. They forward radio packets from devices to the network and vice versa. A
                  single gateway can handle thousands of devices simultaneously. Once registered,
                  configure your physical gateway to connect to this network.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-700"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Register Gateway
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
