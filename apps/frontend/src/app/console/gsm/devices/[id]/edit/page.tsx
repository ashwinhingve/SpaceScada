'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Activity } from 'lucide-react';
import { gsmAPI } from '@/core/api/endpoints';
import type { GSMDevice } from '@webscada/shared-types';

export default function EditGSMDevicePage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<GSMDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [apn, setApn] = useState('');
  const [apnUsername, setApnUsername] = useState('');
  const [mqttBrokerHost, setMqttBrokerHost] = useState('');
  const [mqttBrokerPort, setMqttBrokerPort] = useState('1883');
  const [mqttTopicPrefix, setMqttTopicPrefix] = useState('');
  const [publishInterval, setPublishInterval] = useState('');
  const [enableOta, setEnableOta] = useState(false);

  useEffect(() => {
    if (deviceId) loadDevice();
  }, [deviceId]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const data = await gsmAPI.devices.getById(deviceId);
      setDevice(data);
      setName(data.name);
      setDescription(data.description || '');
      setTags(data.tags?.join(', ') || '');
      setLatitude(data.location?.latitude?.toString() || '');
      setLongitude(data.location?.longitude?.toString() || '');
      setAltitude(data.location?.altitude?.toString() || '');
      setLocationName(data.location?.location_name || '');
      setApn(data.config?.apn || '');
      setApnUsername(data.config?.apn_username || '');
      setMqttBrokerHost(data.config?.mqtt_broker_host || '');
      setMqttBrokerPort(data.config?.mqtt_broker_port?.toString() || '1883');
      setMqttTopicPrefix(data.config?.mqtt_topic_prefix || '');
      setPublishInterval(data.config?.publish_interval?.toString() || '');
      setEnableOta(data.config?.enable_ota || false);
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

    try {
      setSaving(true);
      await gsmAPI.devices.update(device.id, {
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
          apn: apn || device.config?.apn || '',
          apn_username: apnUsername || undefined,
          mqtt_broker_host: mqttBrokerHost || device.config?.mqtt_broker_host || '',
          mqtt_broker_port: parseInt(mqttBrokerPort),
          mqtt_topic_prefix: mqttTopicPrefix || device.config?.mqtt_topic_prefix || '',
          publish_interval: publishInterval
            ? parseInt(publishInterval)
            : device.config?.publish_interval || 60000,
          enable_ota: enableOta,
        },
      });
      router.push(`/console/gsm/devices/${device.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-blue-500" />
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
          <h1 className="text-3xl font-bold text-white">Edit GSM Device</h1>
          <p className="text-gray-400">Update device configuration</p>
        </div>
      </div>

      {error && device && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Device Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Tags</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Network Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">APN</Label>
                <Input
                  value={apn}
                  onChange={(e) => setApn(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">APN Username</Label>
                <Input
                  value={apnUsername}
                  onChange={(e) => setApnUsername(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">MQTT Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Broker Host</Label>
                <Input
                  value={mqttBrokerHost}
                  onChange={(e) => setMqttBrokerHost(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Port</Label>
                <Input
                  type="number"
                  value={mqttBrokerPort}
                  onChange={(e) => setMqttBrokerPort(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Topic Prefix</Label>
                <Input
                  value={mqttTopicPrefix}
                  onChange={(e) => setMqttTopicPrefix(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Device Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Publish Interval (ms)</Label>
              <Input
                type="number"
                value={publishInterval}
                onChange={(e) => setPublishInterval(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <Label className="text-white">Enable OTA Updates</Label>
              <Switch checked={enableOta} onCheckedChange={setEnableOta} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Location</CardTitle>
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
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Location Name</Label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
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
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
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
