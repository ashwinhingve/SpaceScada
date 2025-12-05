'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { LayerConfig, LayerType } from '@/lib/gis/types';
import { loadGeoJSON, getFeatureStyle, createTextLabel } from '@/lib/gis/utils';
import { DEFAULT_MAP_CONFIG } from '@/lib/gis/layerConfig';

// Declare google namespace for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

interface GISMapProps {
  apiKey: string;
  layers: LayerConfig[];
  onMarkerClick?: (properties: Record<string, any>) => void;
  className?: string;
}

export function GISMap({ apiKey, layers, onMarkerClick, className = '' }: GISMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [dataLayers, setDataLayers] = useState<Map<LayerType, any>>(new Map());
  const [textLabels, setTextLabels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReadyForLayers, setIsMapReadyForLayers] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || map) return;

    if (!apiKey) {
      setError('Google Maps API key is missing');
      setIsLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader
      .load()
      .then(() => {
        const gmaps = (window as any).google?.maps || (globalThis as any).google?.maps;
        if (!gmaps) {
          setError('Google Maps API not loaded');
          setIsLoading(false);
          return;
        }

        const mapInstance = new gmaps.Map(mapRef.current!, {
          ...DEFAULT_MAP_CONFIG,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: gmaps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: gmaps.ControlPosition.TOP_RIGHT,
            mapTypeIds: [
              gmaps.MapTypeId.ROADMAP,
              gmaps.MapTypeId.SATELLITE,
              gmaps.MapTypeId.HYBRID,
              gmaps.MapTypeId.TERRAIN,
            ],
          },
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
          scaleControl: true,
          rotateControl: true,
          tilt: 45,
        });

        // Mark map instance immediately
        setMap(mapInstance);

        // ✅ Wait until the map has finished its first render with timeout fallback
        let timeoutId: NodeJS.Timeout;
        let idleHandled = false;

        const handleMapReady = () => {
          if (!idleHandled) {
            idleHandled = true;
            clearTimeout(timeoutId);
            setIsMapReadyForLayers(true);
            setIsLoading(false);
            console.log('Google Maps loaded successfully');
          }
        };

        gmaps.event.addListenerOnce(mapInstance, 'idle', handleMapReady);

        // Fallback: if 'idle' doesn't fire within 5 seconds, proceed anyway
        timeoutId = setTimeout(() => {
          if (!idleHandled) {
            console.warn('Map idle event timeout - proceeding anyway');
            handleMapReady();
          }
        }, 5000);
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps');
        setIsLoading(false);
      });

    // Optional cleanup
    return () => {
      setMap(null);
      setIsMapReadyForLayers(false);
      // Remove labels
      textLabels.forEach((label) => label.setMap(null));
      setTextLabels([]);
      // Detach data layers
      dataLayers.forEach((dl) => dl.setMap(null));
      setDataLayers(new Map());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, mapRef]);

  // Load and render one layer
  const loadLayer = useCallback(
    async (layerConfig: LayerConfig) => {
      if (!map || !isMapReadyForLayers) return;

      try {
        const gmaps = (window as any).google?.maps || (globalThis as any).google?.maps;
        if (!gmaps) return;

        const geoJsonData = await loadGeoJSON(layerConfig.dataUrl);
        if (!geoJsonData) return;

        const dataLayer = new gmaps.Data({
          map: layerConfig.enabled ? map : undefined,
        });

        dataLayer.addGeoJson(geoJsonData);
        dataLayer.setStyle((feature: any) => getFeatureStyle(feature, layerConfig));

        dataLayer.addListener('click', (event: any) => {
          const properties: Record<string, any> = {};
          event.feature.forEachProperty((value: any, key: string) => {
            properties[key] = value;
          });

          if (onMarkerClick) {
            onMarkerClick(properties);
          }

          const infoWindow = new gmaps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
                  ${properties.name || 'Feature'}
                </h3>
                ${Object.entries(properties)
                  .filter(([key]) => key !== 'name')
                  .map(
                    ([key, value]) =>
                      `<div style="font-size: 12px; margin: 4px 0;">
                        <strong>${key}:</strong> ${value}
                      </div>`
                  )
                  .join('')}
              </div>
            `,
            position: event.latLng,
          });
          infoWindow.open(map);
        });

        // Node number labels
        if (layerConfig.id === LayerType.NODE_NUMBERS && Array.isArray(geoJsonData.features)) {
          const labels: any[] = [];
          geoJsonData.features.forEach((feature: any) => {
            if (feature.geometry?.type === 'Point') {
              const [lng, lat] = feature.geometry.coordinates;
              const label = createTextLabel(
                { lat, lng },
                feature.properties?.label || feature.properties?.name || '',
                layerConfig.color
              );
              if (layerConfig.enabled) {
                label.setMap(map);
              }
              labels.push(label);
            }
          });

          setTextLabels((prev) => [...prev, ...labels]);
        }

        setDataLayers((prev) => {
          const next = new Map(prev);
          next.set(layerConfig.id, dataLayer);
          return next;
        });
      } catch (err) {
        console.error(`Error loading layer ${layerConfig.id}:`, err);
      }
    },
    [map, isMapReadyForLayers, onMarkerClick]
  );

  // Load all layers only after map is ready
  useEffect(() => {
    if (!map || !isMapReadyForLayers) return;

    layers.forEach((layer) => {
      if (!dataLayers.has(layer.id)) {
        loadLayer(layer);
      }
    });
  }, [map, isMapReadyForLayers, layers, dataLayers, loadLayer]);

  // Toggle layer visibility (including labels)
  useEffect(() => {
    if (!map || !isMapReadyForLayers) return;

    layers.forEach((layer) => {
      const dataLayer = dataLayers.get(layer.id);
      if (dataLayer) {
        dataLayer.setMap(layer.enabled ? map : null);
      }

      if (layer.id === LayerType.NODE_NUMBERS) {
        textLabels.forEach((label) => {
          label.setMap(layer.enabled ? map : null);
        });
      }
    });
  }, [map, isMapReadyForLayers, layers, dataLayers, textLabels]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
