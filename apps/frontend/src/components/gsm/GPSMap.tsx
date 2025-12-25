'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { GPSLocation, GPSFixType } from '@webscada/shared-types';
import L from 'leaflet';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GPSMapProps {
  location: GPSLocation;
  locationHistory?: GPSLocation[];
  showPath?: boolean;
  height?: string;
}

export function GPSMap({
  location,
  locationHistory = [],
  showPath = false,
  height = '400px',
}: GPSMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getFixColor = (fix: GPSFixType) => {
    switch (fix) {
      case 'FIX_3D':
        return 'green';
      case 'FIX_2D':
        return 'yellow';
      case 'NO_FIX':
      default:
        return 'red';
    }
  };

  const createCustomIcon = (fix: GPSFixType) => {
    const color = getFixColor(fix);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  if (!mounted) {
    return (
      <div
        className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    );
  }

  const center: [number, number] = [location.latitude, location.longitude];

  // Create polyline coordinates from history
  const pathCoordinates: [number, number][] = locationHistory.map((loc) => [
    loc.latitude,
    loc.longitude,
  ]);

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current location marker */}
        <Marker position={center} icon={createCustomIcon(location.fix)}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold mb-1">Current Location</p>
              <p>Lat: {location.latitude.toFixed(6)}</p>
              <p>Lng: {location.longitude.toFixed(6)}</p>
              {location.altitude && <p>Alt: {location.altitude.toFixed(1)}m</p>}
              {location.speed && <p>Speed: {location.speed.toFixed(1)} km/h</p>}
              {location.satellites && <p>Satellites: {location.satellites}</p>}
              <p className="mt-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1 bg-${getFixColor(
                    location.fix
                  )}-500`}
                />
                {location.fix.replace('_', ' ')}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Historical path */}
        {showPath && pathCoordinates.length > 1 && (
          <Polyline positions={pathCoordinates} color="blue" weight={3} opacity={0.6} />
        )}

        {/* Historical location markers */}
        {showPath &&
          locationHistory.map((loc, index) => (
            <Marker
              key={index}
              position={[loc.latitude, loc.longitude]}
              icon={L.divIcon({
                className: 'custom-marker-small',
                html: `
                  <div style="
                    width: 8px;
                    height: 8px;
                    background-color: blue;
                    border: 1px solid white;
                    border-radius: 50%;
                  "></div>
                `,
                iconSize: [8, 8],
                iconAnchor: [4, 4],
              })}
            >
              <Popup>
                <div className="text-xs">
                  <p>Historical Point {index + 1}</p>
                  <p>Lat: {loc.latitude.toFixed(6)}</p>
                  <p>Lng: {loc.longitude.toFixed(6)}</p>
                  <p className="text-gray-500">{new Date(loc.timestamp).toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
