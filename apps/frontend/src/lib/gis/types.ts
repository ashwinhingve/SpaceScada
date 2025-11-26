/**
 * GIS Module Types for WebSCADA
 * Defines all types for Google Maps integration with KML/GeoJSON data
 */

export enum LayerType {
  OMS_LOCATIONS = 'oms_locations',
  MAIN_PIPELINE = 'main_pipeline',
  VILLAGE_BOUNDARIES = 'village_boundaries',
  AIR_VALVES = 'air_valves',
  SQUARE_VALVES = 'square_valves',
  SLUICE_VALVES = 'sluice_valves',
  NODE_NUMBERS = 'node_numbers',
  MINOR_PIPELINE = 'minor_pipeline',
}

export enum ValveType {
  AIR = 'air',
  SQUARE = 'square',
  SLUICE = 'sluice',
}

export interface LayerConfig {
  id: LayerType;
  name: string;
  description: string;
  enabled: boolean;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  icon?: string;
  zIndex?: number;
  dataUrl: string;
}

export interface OMSLocation {
  id: string;
  name: string;
  omsNumber: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive' | 'maintenance';
  pressure?: number;
  flow?: number;
  lastUpdate?: string;
}

export interface Valve {
  id: string;
  name: string;
  type: ValveType;
  latitude: number;
  longitude: number;
  status: 'open' | 'closed' | 'partial';
  nodeNumber?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: 'main' | 'minor';
  coordinates: [number, number][];
  diameter?: number;
  material?: string;
  pressure?: number;
}

export interface Boundary {
  id: string;
  name: string;
  type: 'village' | 'cluster';
  coordinates: [number, number][][];
  population?: number;
  area?: number;
}

export interface NodeMarker {
  id: string;
  nodeNumber: string;
  omsNumber?: string;
  latitude: number;
  longitude: number;
  label: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeId?: string;
  styles?: google.maps.MapTypeStyle[];
}

export interface LayerControlProps {
  layers: LayerConfig[];
  onLayerToggle: (layerId: LayerType) => void;
  onLayerVisibilityChange?: (layerId: LayerType, visible: boolean) => void;
}

export interface GISMapProps {
  config: MapConfig;
  layers: LayerConfig[];
  onMarkerClick?: (feature: GeoJSONFeature) => void;
  onMapClick?: (lat: number, lng: number) => void;
}
