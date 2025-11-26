'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { wifiAPI } from '@/core/api/endpoints';
import { WiFiChipset } from '@webscada/shared-types';

export default function NewWiFiDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [chipset, setChipset] = useState<WiFiChipset>(WiFiChipset.ESP32);
  const [useDhcp, setUseDhcp] = useState(true);
  const [staticIp, setStaticIp] = useState('');
  const [gateway, setGateway] = useState('');
  const [subnetMask, setSubnetMask] = useState('');
  const [mqttEnabled, setMqttEnabled] = useState(false);
  const [mqttHost, setMqttHost] = useState('');
  const [mqttPort, setMqttPort] = useState('1883');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !macAddress.trim() || !ssid.trim()) {
      setError('Name, MAC address, and SSID are required');
      return;
    }

    try {
      setLoading(true);
      await wifiAPI.devices.create({
        name,
        description: description || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
        location:
          latitude && longitude
            ? {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              }
            : undefined,
        config: {
          mac_address: macAddress,
          ssid,
          password: password || undefined,
          chipset,
          use_dhcp: useDhcp,
          static_ip: !useDhcp ? staticIp : undefined,
          gateway: !useDhcp ? gateway : undefined,
          subnet_mask: !useDhcp ? subnetMask : undefined,
          mqtt_enabled: mqttEnabled,
          mqtt_broker_host: mqttEnabled ? mqttHost : undefined,
          mqtt_broker_port: mqttEnabled ? parseInt(mqttPort) : undefined,
        },
      });
      router.push('/console/wifi/devices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device');
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
        <div>
          <h1 className="text-3xl font-bold text-white">Add New Wi-Fi Device</h1>
          <p className="text-gray-400">Register a new Wi-Fi connected device</p>
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
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Device Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., WiFi Sensor 01"
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
                <Label className="text-white">MAC Address *</Label>
                <Input
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Chipset</Label>
                <Select value={chipset} onValueChange={(v) => setChipset(v as WiFiChipset)}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value={WiFiChipset.ESP32}>ESP32</SelectItem>
                    <SelectItem value={WiFiChipset.ESP8266}>ESP8266</SelectItem>
                    <SelectItem value={WiFiChipset.ESP32_C3}>ESP32-C3</SelectItem>
                    <SelectItem value={WiFiChipset.ESP32_S2}>ESP32-S2</SelectItem>
                    <SelectItem value={WiFiChipset.ESP32_S3}>ESP32-S3</SelectItem>
                    <SelectItem value={WiFiChipset.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">SSID *</Label>
                <Input
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Wi-Fi Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Network Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <Label className="text-white">Use DHCP</Label>
              <Switch checked={useDhcp} onCheckedChange={setUseDhcp} />
            </div>
            {!useDhcp && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Static IP</Label>
                  <Input
                    value={staticIp}
                    onChange={(e) => setStaticIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="bg-gray-900 border-gray-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Gateway</Label>
                  <Input
                    value={gateway}
                    onChange={(e) => setGateway(e.target.value)}
                    placeholder="192.168.1.1"
                    className="bg-gray-900 border-gray-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Subnet Mask</Label>
                  <Input
                    value={subnetMask}
                    onChange={(e) => setSubnetMask(e.target.value)}
                    placeholder="255.255.255.0"
                    className="bg-gray-900 border-gray-700 text-white font-mono"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">MQTT Configuration (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <Label className="text-white">Enable MQTT</Label>
              <Switch checked={mqttEnabled} onCheckedChange={setMqttEnabled} />
            </div>
            {mqttEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">MQTT Broker Host</Label>
                  <Input
                    value={mqttHost}
                    onChange={(e) => setMqttHost(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">MQTT Port</Label>
                  <Input
                    type="number"
                    value={mqttPort}
                    onChange={(e) => setMqttPort(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Location (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Device
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
