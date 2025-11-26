'use client';

/**
 * GIS Dashboard Component
 * Main container for the GIS module with map and controls
 */

import React, { useState } from 'react';
import { GISMap } from './GISMap';
import { LayerControl } from './LayerControl';
import { LayerConfig, LayerType } from '@/lib/gis/types';
import { DEFAULT_LAYERS } from '@/lib/gis/layerConfig';
import { MapPin, Maximize2, Download, Settings } from 'lucide-react';

interface GISDashboardProps {
  apiKey: string;
  className?: string;
}

export function GISDashboard({ apiKey, className = '' }: GISDashboardProps) {
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [selectedFeature, setSelectedFeature] = useState<Record<string, any> | null>(null);

  const handleLayerToggle = (layerId: LayerType) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  };

  const handleMarkerClick = (properties: Record<string, any>) => {
    setSelectedFeature(properties);
  };

  const handleCloseInfo = () => {
    setSelectedFeature(null);
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-gray-900/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">GIS Map View</h2>
              <p className="text-gray-400 text-sm">
                Water Distribution Network Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-colors"
              title="Export Map"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <GISMap
        apiKey={apiKey}
        layers={layers}
        onMarkerClick={handleMarkerClick}
        className="w-full h-full min-h-[600px]"
      />

      {/* Layer Control */}
      <LayerControl layers={layers} onLayerToggle={handleLayerToggle} />

      {/* Feature Info Panel */}
      {selectedFeature && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#1E293B] border border-gray-700 rounded-lg shadow-xl p-4 max-w-md">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-white font-semibold text-base">
              {selectedFeature.name || 'Feature Details'}
            </h3>
            <button
              onClick={handleCloseInfo}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(selectedFeature)
              .filter(([key]) => key !== 'name')
              .map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-400 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-white font-medium">{String(value)}</span>
                </div>
              ))}
          </div>

          {/* Status Indicator */}
          {selectedFeature.status && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    selectedFeature.status === 'active' || selectedFeature.status === 'open'
                      ? 'bg-green-500'
                      : selectedFeature.status === 'inactive' ||
                        selectedFeature.status === 'closed'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                />
                <span className="text-sm text-gray-300 capitalize">
                  {selectedFeature.status}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#1E293B] border border-gray-700 rounded-lg shadow-xl p-3 max-w-xs">
        <h4 className="text-white font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1.5">
          {layers
            .filter((layer) => layer.enabled)
            .slice(0, 5)
            .map((layer) => (
              <div key={layer.id} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-sm border border-gray-600"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-gray-300">{layer.name}</span>
              </div>
            ))}
          {layers.filter((layer) => layer.enabled).length > 5 && (
            <div className="text-xs text-gray-500 italic">
              +{layers.filter((layer) => layer.enabled).length - 5} more layers
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
