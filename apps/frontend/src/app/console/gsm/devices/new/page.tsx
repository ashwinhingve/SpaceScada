'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { gsmAPI } from '@/core/api/endpoints';

export default function NewGSMDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Location
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');
  const [locationName, setLocationName] = useState('');

  // GSM Config
  const [imei, setImei] = useState('');
  const [iccid, setIccid] = useState('');
  const [imsi, setImsi] = useState('');
  const [apn, setApn] = useState('');
  const [apnUsername, setApnUsername] = useState('');
  const [apnPassword, setApnPassword] = useState('');

  // MQTT Config
  const [mqttBrokerHost, setMqttBrokerHost] = useState('');
  const [mqttBrokerPort, setMqttBrokerPort] = useState('1883');
  const [mqttClientId, setMqttClientId] = useState('');
  const [mqttUsername, setMqttUsername] = useState('');
  const [mqttPassword, setMqttPassword] = useState('');
  const [mqttUseTls, setMqttUseTls] = useState(false);
  const [mqttTopicPrefix, setMqttTopicPrefix] = useState('gsm');

  // Device Config
  const [publishInterval, setPublishInterval] = useState('60000');
  const [heartbeatInterval, setHeartbeatInterval] = useState('300000');
  const [enableOta, setEnableOta] = useState(true);
  const [modemModel, setModemModel] = useState('');
  const [firmwareVersion, setFirmwareVersion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Device name is required');
      return;
    }
    if (!imei.trim() || imei.length !== 15) {
      setError('IMEI must be 15 digits');
      return;
    }
    if (!apn.trim()) {
      setError('APN is required');
      return;
    }
    if (!mqttBrokerHost.trim()) {
      setError('MQTT broker host is required');
      return;
    }

    try {
      setLoading(true);

      const deviceData: any = {
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
          imei,
          iccid: iccid || undefined,
          imsi: imsi || undefined,
          apn,
          apn_username: apnUsername || undefined,
          apn_password: apnPassword || undefined,
          mqtt_client_id: mqttClientId || `gsm-${imei}`,
          mqtt_username: mqttUsername || undefined,
          mqtt_password: mqttPassword || undefined,
          mqtt_broker_host: mqttBrokerHost,
          mqtt_broker_port: parseInt(mqttBrokerPort),
          mqtt_use_tls: mqttUseTls,
          mqtt_topic_prefix: mqttTopicPrefix,
          publish_interval: parseInt(publishInterval),
          heartbeat_interval: parseInt(heartbeatInterval),
          enable_ota: enableOta,
          modem_model: modemModel || undefined,
          firmware_version: firmwareVersion || undefined,
        },
      };

      await gsmAPI.devices.create(deviceData);
      router.push('/console/gsm/devices');
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
          <h1 className="text-3xl font-bold text-white">Add New GSM Device</h1>
          <p className="text-gray-400">Register a new GSM/cellular device</p>
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
                  placeholder="e.g., GSM Module 01"
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Tags</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="production, tracking"
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
            <CardTitle className="text-white">GSM Hardware Identifiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">IMEI (15 digits) *</Label>
                <Input
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="000000000000000"
                  maxLength={15}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">ICCID</Label>
                <Input
                  value={iccid}
                  onChange={(e) => setIccid(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">IMSI</Label>
                <Input
                  value={imsi}
                  onChange={(e) => setImsi(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-white">APN *</Label>
                <Input
                  value={apn}
                  onChange={(e) => setApn(e.target.value)}
                  placeholder="e.g., internet"
                  className="bg-gray-900 border-gray-700 text-white"
                  required
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
              <div className="space-y-2">
                <Label className="text-white">APN Password</Label>
                <Input
                  type="password"
                  value={apnPassword}
                  onChange={(e) => setApnPassword(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Broker Host *</Label>
                <Input
                  value={mqttBrokerHost}
                  onChange={(e) => setMqttBrokerHost(e.target.value)}
                  placeholder="mqtt.example.com"
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Broker Port</Label>
                <Input
                  type="number"
                  value={mqttBrokerPort}
                  onChange={(e) => setMqttBrokerPort(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Client ID</Label>
                <Input
                  value={mqttClientId}
                  onChange={(e) => setMqttClientId(e.target.value)}
                  placeholder="Auto-generated if empty"
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
              <div className="space-y-2">
                <Label className="text-white">Username</Label>
                <Input
                  value={mqttUsername}
                  onChange={(e) => setMqttUsername(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Password</Label>
                <Input
                  type="password"
                  value={mqttPassword}
                  onChange={(e) => setMqttPassword(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <Label className="text-white">Use TLS/SSL</Label>
              <Switch checked={mqttUseTls} onCheckedChange={setMqttUseTls} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Device Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Publish Interval (ms)</Label>
                <Input
                  type="number"
                  value={publishInterval}
                  onChange={(e) => setPublishInterval(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Heartbeat Interval (ms)</Label>
                <Input
                  type="number"
                  value={heartbeatInterval}
                  onChange={(e) => setHeartbeatInterval(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Modem Model</Label>
                <Input
                  value={modemModel}
                  onChange={(e) => setModemModel(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Firmware Version</Label>
                <Input
                  value={firmwareVersion}
                  onChange={(e) => setFirmwareVersion(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <Label className="text-white">Enable OTA Updates</Label>
              <Switch checked={enableOta} onCheckedChange={setEnableOta} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Location (Optional)</CardTitle>
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
