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
import { lorawanAPI } from '@/core/api/endpoints';
import { LoRaWANActivation, LoRaWANDeviceClass } from '@webscada/shared-types';
import type { LoRaWANDeviceConfig } from '@webscada/shared-types';

/**
 * Add New LoRaWAN Device Page
 */
export default function NewLoRaWANDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Device basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Location
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [altitude, setAltitude] = useState('');
  const [locationName, setLocationName] = useState('');

  // LoRaWAN identifiers
  const [devEui, setDevEui] = useState('');
  const [appEui, setAppEui] = useState('');
  const [appKey, setAppKey] = useState('');
  const [devAddr, setDevAddr] = useState('');
  const [nwkSKey, setNwkSKey] = useState('');
  const [appSKey, setAppSKey] = useState('');

  // Configuration
  const [activationMode, setActivationMode] = useState<LoRaWANActivation>(LoRaWANActivation.OTAA);
  const [deviceClass, setDeviceClass] = useState<LoRaWANDeviceClass>(LoRaWANDeviceClass.CLASS_A);
  const [spreadingFactor, setSpreadingFactor] = useState('7');
  const [bandwidth, setBandwidth] = useState('125');
  const [codingRate, setCodingRate] = useState('4/5');
  const [frequencyPlan, setFrequencyPlan] = useState('EU868');
  const [chirpstackAppId, setChirpstackAppId] = useState('');
  const [chirpstackProfileId, setChirpstackProfileId] = useState('');
  const [confirmedUplinks, setConfirmedUplinks] = useState(false);
  const [rxDelay, setRxDelay] = useState('1');
  const [rx1DrOffset, setRx1DrOffset] = useState('0');
  const [rx2Dr, setRx2Dr] = useState('0');
  const [rx2Frequency, setRx2Frequency] = useState('');

  // Decoder
  const [decoderName, setDecoderName] = useState('');
  const [decoderScript, setDecoderScript] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Device name is required');
      return;
    }
    if (!devEui.trim() || devEui.length !== 16) {
      setError('DevEUI must be 16 hex characters');
      return;
    }
    if (!appEui.trim() || appEui.length !== 16) {
      setError('AppEUI must be 16 hex characters');
      return;
    }
    if (activationMode === LoRaWANActivation.OTAA && (!appKey.trim() || appKey.length !== 32)) {
      setError('AppKey must be 32 hex characters for OTAA');
      return;
    }
    if (!chirpstackAppId.trim()) {
      setError('ChirpStack Application ID is required');
      return;
    }

    try {
      setLoading(true);

      const config: LoRaWANDeviceConfig = {
        dev_eui: devEui,
        app_eui: appEui,
        app_key: activationMode === LoRaWANActivation.OTAA ? appKey : undefined,
        dev_addr: activationMode === LoRaWANActivation.ABP ? devAddr : undefined,
        nwk_s_key: activationMode === LoRaWANActivation.ABP ? nwkSKey : undefined,
        app_s_key: activationMode === LoRaWANActivation.ABP ? appSKey : undefined,
        activation_mode: activationMode,
        device_class: deviceClass,
        spreading_factor: parseInt(spreadingFactor),
        bandwidth: parseInt(bandwidth),
        coding_rate: codingRate,
        frequency_plan: frequencyPlan,
        chirpstack_application_id: chirpstackAppId,
        chirpstack_device_profile_id: chirpstackProfileId || undefined,
        decoder_name: decoderName || undefined,
        decoder_script: decoderScript || undefined,
        confirmed_uplinks: confirmedUplinks,
        rx_delay: parseInt(rxDelay),
        rx1_dr_offset: parseInt(rx1DrOffset),
        rx2_dr: parseInt(rx2Dr),
        rx2_frequency: rx2Frequency ? parseInt(rx2Frequency) : undefined,
      };

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
        config,
      };

      await lorawanAPI.devices.create(deviceData);
      router.push('/console/lorawan/devices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create device');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white">Add New LoRaWAN Device</h1>
          <p className="text-gray-400">Register a new LoRaWAN end device</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
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

        {/* LoRaWAN Identifiers */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">LoRaWAN Identifiers</CardTitle>
            <CardDescription className="text-gray-400">
              Device EUIs and activation keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="devEui" className="text-white">
                  DevEUI (16 hex chars) *
                </Label>
                <Input
                  id="devEui"
                  value={devEui}
                  onChange={(e) => setDevEui(e.target.value.toUpperCase())}
                  placeholder="0000000000000000"
                  maxLength={16}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appEui" className="text-white">
                  AppEUI (16 hex chars) *
                </Label>
                <Input
                  id="appEui"
                  value={appEui}
                  onChange={(e) => setAppEui(e.target.value.toUpperCase())}
                  placeholder="0000000000000000"
                  maxLength={16}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activationMode" className="text-white">
                  Activation Mode *
                </Label>
                <Select
                  value={activationMode}
                  onValueChange={(v) => setActivationMode(v as LoRaWANActivation)}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value={LoRaWANActivation.OTAA}>
                      OTAA (Over-The-Air Activation)
                    </SelectItem>
                    <SelectItem value={LoRaWANActivation.ABP}>
                      ABP (Activation By Personalization)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceClass" className="text-white">
                  Device Class *
                </Label>
                <Select
                  value={deviceClass}
                  onValueChange={(v) => setDeviceClass(v as LoRaWANDeviceClass)}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value={LoRaWANDeviceClass.CLASS_A}>
                      Class A (Battery powered)
                    </SelectItem>
                    <SelectItem value={LoRaWANDeviceClass.CLASS_B}>
                      Class B (Scheduled downlinks)
                    </SelectItem>
                    <SelectItem value={LoRaWANDeviceClass.CLASS_C}>
                      Class C (Always listening)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activationMode === LoRaWANActivation.OTAA && (
              <div className="space-y-2">
                <Label htmlFor="appKey" className="text-white">
                  AppKey (32 hex chars) *
                </Label>
                <Input
                  id="appKey"
                  type="password"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value.toUpperCase())}
                  placeholder="00000000000000000000000000000000"
                  maxLength={32}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                  required={activationMode === LoRaWANActivation.OTAA}
                />
              </div>
            )}

            {activationMode === LoRaWANActivation.ABP && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="devAddr" className="text-white">
                    DevAddr (8 hex chars) *
                  </Label>
                  <Input
                    id="devAddr"
                    value={devAddr}
                    onChange={(e) => setDevAddr(e.target.value.toUpperCase())}
                    placeholder="00000000"
                    maxLength={8}
                    className="bg-gray-900 border-gray-700 text-white font-mono"
                    required={activationMode === LoRaWANActivation.ABP}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nwkSKey" className="text-white">
                      NwkSKey (32 hex chars) *
                    </Label>
                    <Input
                      id="nwkSKey"
                      type="password"
                      value={nwkSKey}
                      onChange={(e) => setNwkSKey(e.target.value.toUpperCase())}
                      placeholder="00000000000000000000000000000000"
                      maxLength={32}
                      className="bg-gray-900 border-gray-700 text-white font-mono"
                      required={activationMode === LoRaWANActivation.ABP}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appSKey" className="text-white">
                      AppSKey (32 hex chars) *
                    </Label>
                    <Input
                      id="appSKey"
                      type="password"
                      value={appSKey}
                      onChange={(e) => setAppSKey(e.target.value.toUpperCase())}
                      placeholder="00000000000000000000000000000000"
                      maxLength={32}
                      className="bg-gray-900 border-gray-700 text-white font-mono"
                      required={activationMode === LoRaWANActivation.ABP}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Radio Configuration */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Radio Configuration</CardTitle>
            <CardDescription className="text-gray-400">LoRaWAN radio parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spreadingFactor" className="text-white">
                  Spreading Factor
                </Label>
                <Select value={spreadingFactor} onValueChange={setSpreadingFactor}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {[7, 8, 9, 10, 11, 12].map((sf) => (
                      <SelectItem key={sf} value={sf.toString()}>
                        SF{sf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bandwidth" className="text-white">
                  Bandwidth (kHz)
                </Label>
                <Select value={bandwidth} onValueChange={setBandwidth}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="125">125 kHz</SelectItem>
                    <SelectItem value="250">250 kHz</SelectItem>
                    <SelectItem value="500">500 kHz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codingRate" className="text-white">
                  Coding Rate
                </Label>
                <Select value={codingRate} onValueChange={setCodingRate}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="4/5">4/5</SelectItem>
                    <SelectItem value="4/6">4/6</SelectItem>
                    <SelectItem value="4/7">4/7</SelectItem>
                    <SelectItem value="4/8">4/8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequencyPlan" className="text-white">
                Frequency Plan
              </Label>
              <Select value={frequencyPlan} onValueChange={setFrequencyPlan}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="EU868">EU868 (Europe)</SelectItem>
                  <SelectItem value="US915">US915 (North America)</SelectItem>
                  <SelectItem value="AS923">AS923 (Asia)</SelectItem>
                  <SelectItem value="AU915">AU915 (Australia)</SelectItem>
                  <SelectItem value="IN865">IN865 (India)</SelectItem>
                </SelectContent>
              </Select>
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
                  Application ID *
                </Label>
                <Input
                  id="chirpstackAppId"
                  value={chirpstackAppId}
                  onChange={(e) => setChirpstackAppId(e.target.value)}
                  placeholder="e.g., app-01"
                  className="bg-gray-900 border-gray-700 text-white"
                  required
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
          <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
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
