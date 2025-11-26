/**
 * GIS Utility Functions
 * Helper functions for GeoJSON processing and Google Maps operations
 */

import { GeoJSONFeature, GeoJSONFeatureCollection, LayerConfig } from './types';

/**
 * Load GeoJSON data from server
 */
export async function loadGeoJSON(url: string): Promise<GeoJSONFeatureCollection | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return null;
  }
}

/**
 * Apply styles to a Google Maps Data layer based on feature properties
 */
export function getFeatureStyle(
  feature: google.maps.Data.Feature,
  layerConfig: LayerConfig
): google.maps.Data.StyleOptions {
  const geometryType = feature.getGeometry()?.getType();

  const baseStyle: google.maps.Data.StyleOptions = {
    fillColor: layerConfig.color,
    strokeColor: layerConfig.strokeColor || layerConfig.color,
    strokeWeight: layerConfig.strokeWidth || 2,
    fillOpacity: layerConfig.fillOpacity || 0.3,
    zIndex: layerConfig.zIndex || 5,
  };

  // Customize based on geometry type
  if (geometryType === 'Point') {
    return {
      ...baseStyle,
      icon: layerConfig.icon
        ? {
            url: layerConfig.icon,
            scaledSize: new google.maps.Size(24, 24),
          }
        : undefined,
    };
  }

  if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
    return {
      ...baseStyle,
      fillOpacity: 0,
      strokeWeight: layerConfig.strokeWidth || 3,
    };
  }

  if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
    return {
      ...baseStyle,
      fillOpacity: layerConfig.fillOpacity || 0.2,
    };
  }

  return baseStyle;
}

/**
 * Create a custom marker for specific feature types
 */
export function createCustomMarker(
  position: google.maps.LatLngLiteral,
  properties: Record<string, any>,
  icon?: string
): google.maps.Marker {
  return new google.maps.Marker({
    position,
    icon: icon
      ? {
          url: icon,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        }
      : undefined,
    title: properties.name || properties.label || '',
  });
}

/**
 * Create text label overlay for nodes and OMS numbers
 */
export function createTextLabel(
  position: google.maps.LatLngLiteral,
  text: string,
  color: string = '#000000'
): google.maps.Marker {
  return new google.maps.Marker({
    position,
    icon: {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="30">
          <rect width="100" height="30" fill="white" fill-opacity="0.8" rx="3"/>
          <text x="50" y="20" font-family="Arial, sans-serif" font-size="12" font-weight="bold"
                fill="${color}" text-anchor="middle">${text}</text>
        </svg>
      `)}`,
      anchor: new google.maps.Point(50, 15),
    },
    zIndex: 1000,
  });
}

/**
 * Calculate bounds for a set of coordinates
 */
export function calculateBounds(
  coordinates: [number, number][]
): google.maps.LatLngBounds {
  const bounds = new google.maps.LatLngBounds();
  coordinates.forEach(([lng, lat]) => {
    bounds.extend({ lat, lng });
  });
  return bounds;
}

/**
 * Convert KML to GeoJSON (basic conversion)
 */
export function kmlToGeoJSON(kmlString: string): GeoJSONFeatureCollection {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlString, 'text/xml');
  const placemarks = kmlDoc.getElementsByTagName('Placemark');

  const features: GeoJSONFeature[] = [];

  Array.from(placemarks).forEach((placemark) => {
    const name = placemark.getElementsByTagName('name')[0]?.textContent || '';
    const description =
      placemark.getElementsByTagName('description')[0]?.textContent || '';

    // Extract coordinates (simplified - handles Point, LineString, Polygon)
    const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;
    if (!coordinates) return;

    const coords = coordinates
      .trim()
      .split(/\s+/)
      .map((coord) => {
        const [lng, lat] = coord.split(',').map(parseFloat);
        return [lng, lat];
      });

    // Determine geometry type
    let geometryType: 'Point' | 'LineString' | 'Polygon' = 'Point';
    if (coords.length > 1) {
      geometryType = coords[0][0] === coords[coords.length - 1][0] ? 'Polygon' : 'LineString';
    }

    features.push({
      type: 'Feature',
      geometry: {
        type: geometryType,
        coordinates: geometryType === 'Point' ? coords[0] : coords,
      },
      properties: {
        name,
        description,
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Get status color based on valve or OMS status
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: '#4CAF50',
    inactive: '#9E9E9E',
    maintenance: '#FF9800',
    open: '#4CAF50',
    closed: '#F44336',
    partial: '#FF9800',
    online: '#4CAF50',
    offline: '#F44336',
  };

  return statusColors[status.toLowerCase()] || '#9E9E9E';
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
