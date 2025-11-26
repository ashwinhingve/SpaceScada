'use client';

/**
 * Layer Control Component
 * Provides UI controls to toggle map layers on/off
 */

import React, { useState } from 'react';
import { LayerConfig, LayerType } from '@/lib/gis/types';
import { Eye, EyeOff, ChevronDown, ChevronRight, Layers } from 'lucide-react';

interface LayerControlProps {
  layers: LayerConfig[];
  onLayerToggle: (layerId: LayerType) => void;
  className?: string;
}

export function LayerControl({ layers, onLayerToggle, className = '' }: LayerControlProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({
    infrastructure: true,
    valves: true,
    labels: true,
  });

  const categorizeLayer = (layerId: LayerType): string => {
    if (
      [LayerType.MAIN_PIPELINE, LayerType.MINOR_PIPELINE, LayerType.OMS_LOCATIONS].includes(
        layerId
      )
    ) {
      return 'infrastructure';
    }
    if (
      [LayerType.AIR_VALVES, LayerType.SQUARE_VALVES, LayerType.SLUICE_VALVES].includes(layerId)
    ) {
      return 'valves';
    }
    if ([LayerType.NODE_NUMBERS, LayerType.VILLAGE_BOUNDARIES].includes(layerId)) {
      return 'labels';
    }
    return 'other';
  };

  const getCategoryName = (category: string): string => {
    const names: Record<string, string> = {
      infrastructure: 'Infrastructure',
      valves: 'Valves',
      labels: 'Labels & Boundaries',
      other: 'Other',
    };
    return names[category] || category;
  };

  const toggleCategory = (category: string) => {
    setCategoryExpanded((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const groupedLayers = layers.reduce((acc, layer) => {
    const category = categorizeLayer(layer.id);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(layer);
    return acc;
  }, {} as Record<string, LayerConfig[]>);

  return (
    <div
      className={`absolute top-4 right-4 bg-[#1E293B] border border-gray-700 rounded-lg shadow-xl z-10 ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <span className="text-white font-semibold text-sm">Map Layers</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Layer List */}
      {isExpanded && (
        <div className="max-h-[500px] overflow-y-auto">
          {Object.entries(groupedLayers).map(([category, categoryLayers]) => (
            <div key={category} className="border-b border-gray-800 last:border-b-0">
              {/* Category Header */}
              <div
                className="flex items-center justify-between p-2 px-3 bg-gray-800/30 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <span className="text-gray-300 text-xs font-medium uppercase tracking-wide">
                  {getCategoryName(category)}
                </span>
                {categoryExpanded[category] ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
              </div>

              {/* Layer Items */}
              {categoryExpanded[category] && (
                <div className="py-1">
                  {categoryLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center gap-3 p-2 px-3 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                      onClick={() => onLayerToggle(layer.id)}
                    >
                      {/* Visibility Toggle */}
                      <button
                        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerToggle(layer.id);
                        }}
                      >
                        {layer.enabled ? (
                          <Eye className="h-4 w-4 text-blue-400" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>

                      {/* Color Indicator */}
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0 border border-gray-600"
                        style={{ backgroundColor: layer.color }}
                      />

                      {/* Layer Info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium ${
                            layer.enabled ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          {layer.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {layer.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      {isExpanded && (
        <div className="p-2 px-3 bg-gray-800/30 border-t border-gray-700 text-xs text-gray-400">
          {layers.filter((l) => l.enabled).length} of {layers.length} layers active
        </div>
      )}
    </div>
  );
}
