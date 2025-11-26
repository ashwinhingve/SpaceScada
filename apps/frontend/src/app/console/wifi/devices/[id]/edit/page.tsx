'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2, Activity } from 'lucide-react';
import { wifiAPI } from '@/core/api/endpoints';
import type { WiFiDevice } from '@webscada/shared-types';

export default function EditWiFiDevicePage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id as string;

  const [device, setDevice] = useState<WiFiDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [useDhcp, setUseDhcp] = useState(true);
  const [staticIp, setStaticIp] = useState('');
  const [mqttEnabled, setMqttEnabled] = useState(false);
  const [mqttHost, setMqttHost] = useState('');

  useEffect(() => {
    if (deviceId) loadDevice();
  }, [deviceId]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const data = await wifiAPI.devices.getById(deviceId);
      setDevice(data);
      setName(data.name);
      setDescription(data.description || '');
      setTags(data.tags?.join(', ') || '');
      setSsid(data.config?.ssid || '');
      setUseDhcp(data.config?.use_dhcp ?? true);
      setStaticIp(data.config?.static_ip || '');
      setMqttEnabled(data.config?.mqtt_enabled || false);
      setMqttHost(data.config?.mqtt_broker_host || '');
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
      await wifiAPI.devices.update(device.id, {
        name,
        description: description || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
        config: {
          ...device.config,
          ssid,
          password: password || undefined,
          use_dhcp: useDhcp,
          static_ip: !useDhcp ? staticIp : undefined,
          mqtt_enabled: mqttEnabled,
          mqtt_broker_host: mqttEnabled ? mqttHost : undefined,
        },
      });
      router.push(`/console/wifi/devices/${device.id}`);
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
          <h1 className="text-3xl font-bold text-white">Edit Wi-Fi Device</h1>
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
            <CardTitle className="text-white">Wi-Fi Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">SSID</Label>
                <Input
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty to keep current"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <Label className="text-white">Use DHCP</Label>
              <Switch checked={useDhcp} onCheckedChange={setUseDhcp} />
            </div>
            {!useDhcp && (
              <div className="space-y-2">
                <Label className="text-white">Static IP</Label>
                <Input
                  value={staticIp}
                  onChange={(e) => setStaticIp(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">MQTT Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <Label className="text-white">Enable MQTT</Label>
              <Switch checked={mqttEnabled} onCheckedChange={setMqttEnabled} />
            </div>
            {mqttEnabled && (
              <div className="space-y-2">
                <Label className="text-white">Broker Host</Label>
                <Input
                  value={mqttHost}
                  onChange={(e) => setMqttHost(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            )}
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
