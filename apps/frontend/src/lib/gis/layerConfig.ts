/**
 * Layer Configuration for GIS Module
 * Defines default settings for all map layers
 */

import { LayerConfig, LayerType } from './types';

export const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: LayerType.OMS_LOCATIONS,
    name: 'OMS Locations',
    description: 'OMS (Operation & Maintenance Station) location points',
    enabled: false,
    color: '#2196F3',
    zIndex: 10,
    dataUrl: '/gis/data/oms-locations.geojson',
  },
  {
    id: LayerType.MAIN_PIPELINE,
    name: 'Main Pipeline',
    description: 'Main water distribution pipeline network',
    enabled: false,
    color: '#1976D2',
    strokeColor: '#1976D2',
    strokeWidth: 4,
    fillOpacity: 0,
    zIndex: 5,
    dataUrl: '/gis/data/main-pipeline.geojson',
  },
  {
    id: LayerType.MINOR_PIPELINE,
    name: 'Minor Pipeline',
    description: 'Minor distribution pipelines',
    enabled: false,
    color: '#64B5F6',
    strokeColor: '#64B5F6',
    strokeWidth: 2,
    fillOpacity: 0,
    zIndex: 4,
    dataUrl: '/gis/data/minor-pipeline.geojson',
  },
  {
    id: LayerType.VILLAGE_BOUNDARIES,
    name: 'Village/Cluster Boundaries',
    description: 'Administrative boundaries for villages and clusters',
    enabled: false,
    color: '#4CAF50',
    strokeColor: '#388E3C',
    strokeWidth: 2,
    fillOpacity: 0.2,
    zIndex: 1,
    dataUrl: '/gis/data/boundaries.geojson',
  },
  {
    id: LayerType.AIR_VALVES,
    name: 'Air Valves',
    description: 'Air release valve locations',
    enabled: false,
    color: '#FF9800',
    zIndex: 8,
    dataUrl: '/gis/data/air-valves.geojson',
  },
  {
    id: LayerType.SQUARE_VALVES,
    name: 'Square Valves',
    description: 'Square valve locations',
    enabled: false,
    color: '#F44336',
    zIndex: 8,
    dataUrl: '/gis/data/square-valves.geojson',
  },
  {
    id: LayerType.SLUICE_VALVES,
    name: 'Sluice Valves',
    description: 'Sluice gate valve locations',
    enabled: false,
    color: '#9C27B0',
    zIndex: 8,
    dataUrl: '/gis/data/sluice-valves.geojson',
  },
  {
    id: LayerType.NODE_NUMBERS,
    name: 'Node Numbers',
    description: 'Node and OMS number labels',
    enabled: false,
    color: '#000000',
    zIndex: 15,
    dataUrl: '/gis/data/node-numbers.geojson',
  },
];

export const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

export const DEFAULT_MAP_CONFIG = {
  center: { lat: 17.385, lng: 78.4867 }, // Default: Hyderabad, India
  zoom: 12,
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
  styles: MAP_STYLES,
};

export const MARKER_ICONS = {
  oms: {
    url: '/gis/icons/oms-marker.png',
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 32 },
  },
  airValve: {
    url: '/gis/icons/air-valve.png',
    scaledSize: { width: 24, height: 24 },
    anchor: { x: 12, y: 12 },
  },
  squareValve: {
    url: '/gis/icons/square-valve.png',
    scaledSize: { width: 24, height: 24 },
    anchor: { x: 12, y: 12 },
  },
  sluiceValve: {
    url: '/gis/icons/sluice-valve.png',
    scaledSize: { width: 24, height: 24 },
    anchor: { x: 12, y: 12 },
  },
  node: {
    url: '/gis/icons/node-marker.png',
    scaledSize: { width: 20, height: 20 },
    anchor: { x: 10, y: 10 },
  },
};
