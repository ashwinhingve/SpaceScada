'use client';

import L from 'leaflet';
import { MapPin, Maximize2 } from 'lucide-react';
import * as React from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface DeviceLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'connected' | 'disconnected' | 'warning' | 'error';
  type?: string;
  lastSeen?: string;
}

export interface DeviceMapProps {
  devices: DeviceLocation[];
  center?: [number, number];
  zoom?: number;
  onDeviceClick?: (device: DeviceLocation) => void;
  className?: string;
}

// Custom marker icons based on status
const createCustomIcon = (status: string) => {
  const colors: Record<string, string> = {
    connected: '#22c55e',
    disconnected: '#ef4444',
    warning: '#eab308',
    error: '#f97316',
  };

  const color = colors[status] || colors.connected;

  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export function DeviceMap({
  devices,
  center = [0, 0],
  zoom = 2,
  onDeviceClick,
  className,
}: DeviceMapProps) {
  const [mapCenter, setMapCenter] = React.useState<[number, number]>(center);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (devices.length > 0) {
      const avgLat = devices.reduce((sum, d) => sum + d.lat, 0) / devices.length;
      const avgLng = devices.reduce((sum, d) => sum + d.lng, 0) / devices.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [devices]);

  if (!isClient) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Device Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] flex items-center justify-center bg-muted/20 rounded-md">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Device Locations
        </CardTitle>
        <Button variant="ghost" size="icon">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] rounded-md overflow-hidden border border-border/40">
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <MapController center={mapCenter} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {devices.map((device) => (
              <Marker
                key={device.id}
                position={[device.lat, device.lng]}
                icon={createCustomIcon(device.status)}
                eventHandlers={{
                  click: () => onDeviceClick?.(device),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{device.name}</h3>
                    <p className="text-xs text-muted-foreground">{device.id}</p>
                    {device.type && <p className="text-sm mt-1">Type: {device.type}</p>}
                    <p className="text-sm">
                      Status:{' '}
                      <span
                        className={`font-medium ${device.status === 'connected'
                            ? 'text-green-500'
                            : device.status === 'disconnected'
                              ? 'text-red-500'
                              : 'text-yellow-500'
                          }`}
                      >
                        {device.status}
                      </span>
                    </p>
                    {device.lastSeen && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last seen: {device.lastSeen}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Disconnected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
