'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Activity } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANDevice } from '@webscada/shared-types';

/**
 * Edit LoRaWAN Device Page
 */
export default function EditLoRaWANDevicePage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<LoRaWANDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [chirpstackAppId, setChirpstackAppId] = useState('');
  const [chirpstackProfileId, setChirpstackProfileId] = useState('');
  const [confirmedUplinks, setConfirmedUplinks] = useState(false);

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

      // Populate form
      setName(data.name);
      setDescription(data.description || '');
      setTags(data.tags?.join(', ') || '');
      setLatitude(data.location?.latitude?.toString() || '');
      setLongitude(data.location?.longitude?.toString() || '');
      setAltitude(data.location?.altitude?.toString() || '');
      setLocationName(data.location?.location_name || '');
      setChirpstackAppId(data.config?.chirpstack_application_id || '');
      setChirpstackProfileId(data.config?.chirpstack_device_profile_id || '');
      setConfirmedUplinks(data.config?.confirmed_uplinks || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Device name is required');
      return;
    }

    try {
      setSaving(true);

      const updateData: any = {
        name,
        description: description || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
        location:
          latitude && longitude
            ? {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                altitude: altitude ? parseFloat(altitude) : undefined,
                location_name: locationName || undefined,
              }
            : undefined,
        config: {
          ...device.config,
          chirpstack_application_id: chirpstackAppId,
          chirpstack_device_profile_id: chirpstackProfileId || undefined,
          confirmed_uplinks: confirmedUplinks,
        },
      };

      await lorawanAPI.devices.update(device.id, updateData);
      router.push(`/console/lorawan/devices/${device.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error && !device) {
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="border-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white">Edit LoRaWAN Device</h1>
          <p className="text-gray-400">Update device configuration</p>
        </div>
      </div>

      {/* Error Display */}
      {error && device && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
            <CardDescription className="text-gray-400">
              Device identification and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Device Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Temperature Sensor 01"
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-white">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., production, sensor, zone-a"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter device description"
                className="bg-gray-900 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* ChirpStack Configuration */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">ChirpStack Integration</CardTitle>
            <CardDescription className="text-gray-400">
              ChirpStack application and device profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chirpstackAppId" className="text-white">
                  Application ID
                </Label>
                <Input
                  id="chirpstackAppId"
                  value={chirpstackAppId}
                  onChange={(e) => setChirpstackAppId(e.target.value)}
                  placeholder="e.g., app-01"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chirpstackProfileId" className="text-white">
                  Device Profile ID
                </Label>
                <Input
                  id="chirpstackProfileId"
                  value={chirpstackProfileId}
                  onChange={(e) => setChirpstackProfileId(e.target.value)}
                  placeholder="Optional"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <div>
                <Label htmlFor="confirmedUplinks" className="text-white">
                  Confirmed Uplinks
                </Label>
                <p className="text-sm text-gray-400">Request acknowledgment for uplink messages</p>
              </div>
              <Switch
                id="confirmedUplinks"
                checked={confirmedUplinks}
                onCheckedChange={setConfirmedUplinks}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Location (Optional)</CardTitle>
            <CardDescription className="text-gray-400">
              GPS coordinates of the device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-white">
                  Latitude
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g., 51.5074"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-white">
                  Longitude
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g., -0.1278"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altitude" className="text-white">
                  Altitude (m)
                </Label>
                <Input
                  id="altitude"
                  type="number"
                  step="any"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  placeholder="e.g., 100"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationName" className="text-white">
                Location Name
              </Label>
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Building A - Floor 3"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-700"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700">
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
