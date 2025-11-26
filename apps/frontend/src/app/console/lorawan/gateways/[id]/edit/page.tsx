'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Radio, Activity } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANGateway } from '@/core/api/endpoints/lorawan.api';

export default function EditLoRaWANGatewayPage() {
  const router = useRouter();
  const params = useParams();
  const gatewayId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gatewayIdValue, setGatewayIdValue] = useState('');

  // Location
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');

  useEffect(() => {
    if (gatewayId) loadGateway();
  }, [gatewayId]);

  const loadGateway = async () => {
    try {
      setLoading(true);
      const data = await lorawanAPI.gateways.getById(gatewayId);
      setName(data.name);
      setDescription(data.description || '');
      setGatewayIdValue(data.gateway_id);

      if (data.location) {
        setLatitude(data.location.latitude.toString());
        setLongitude(data.location.longitude.toString());
        setAltitude(data.location.altitude?.toString() || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gateway');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Gateway name is required');
      return;
    }
    if (!gatewayIdValue.trim()) {
      setError('Gateway ID is required');
      return;
    }
    if (gatewayIdValue.length !== 16) {
      setError('Gateway ID must be 16 characters (8 bytes in hex)');
      return;
    }

    try {
      setSaving(true);

      const gatewayData: any = {
        name,
        description: description || undefined,
        gateway_id: gatewayIdValue,
        location:
          latitude && longitude
            ? {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                altitude: altitude ? parseFloat(altitude) : undefined,
              }
            : undefined,
      };

      await lorawanAPI.gateways.update(gatewayId, gatewayData);
      router.push(`/console/lorawan/gateways/${gatewayId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gateway');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error && !name) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

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
            <h1 className="text-3xl font-bold text-white">Edit Gateway</h1>
            <p className="text-gray-400">Update LoRaWAN gateway configuration</p>
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
              Update the basic information for this gateway
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
            </div>

            <div className="space-y-2">
              <Label className="text-white">Gateway ID (EUI-64) *</Label>
              <Input
                value={gatewayIdValue}
                onChange={(e) => setGatewayIdValue(e.target.value.toLowerCase())}
                placeholder="0000000000000000"
                maxLength={16}
                className="bg-gray-900 border-gray-700 text-white font-mono"
                required
              />
              <p className="text-sm text-gray-500">16 character hexadecimal ID (8 bytes)</p>
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
              Physical location coordinates of the gateway
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
          <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
