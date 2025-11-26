'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Play,
  Pause,
} from 'lucide-react';

interface ProcessNode {
  id: string;
  name: string;
  x: number;
  y: number;
  status: 'active' | 'inactive' | 'warning' | 'error';
  value?: string;
}

interface SCADAProcessViewProps {
  title: string;
  backgroundImage?: string;
  nodes?: ProcessNode[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  onNodeClick?: (nodeId: string) => void;
}

export function SCADAProcessView({
  title,
  backgroundImage,
  nodes = [],
  autoRefresh = true,
  refreshInterval: _refreshInterval = 5000,
  onNodeClick,
}: SCADAProcessViewProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLive, setIsLive] = useState(autoRefresh);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const getNodeStatusColor = (status: ProcessNode['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 border-green-400 shadow-green-500/50';
      case 'inactive':
        return 'bg-gray-500 border-gray-400 shadow-gray-500/50';
      case 'warning':
        return 'bg-yellow-500 border-yellow-400 shadow-yellow-500/50';
      case 'error':
        return 'bg-red-500 border-red-400 shadow-red-500/50';
      default:
        return 'bg-blue-500 border-blue-400 shadow-blue-500/50';
    }
  };

  return (
    <Card className="bg-[#1E293B] border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {isLive && (
              <div className="flex items-center gap-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">LIVE</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setIsLive(!isLive)}
              title={isLive ? 'Pause' : 'Resume'}
            >
              {isLive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-gray-700" />
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400 min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-gray-700" />
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              title="Export"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Process Diagram Area */}
      <div className="relative bg-[#0F172A] overflow-auto">
        <div
          className={`relative ${
            isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[500px]'
          } flex items-center justify-center`}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Background Image or Grid */}
          {backgroundImage ? (
            <div className="absolute inset-0">
              <Image
                src={backgroundImage}
                alt="Process Diagram"
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          )}

          {/* Process Nodes */}
          {nodes.length > 0 ? (
            <div className="absolute inset-0">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => onNodeClick?.(node.id)}
                >
                  {/* Node Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${getNodeStatusColor(
                      node.status
                    )} animate-pulse shadow-lg`}
                  />

                  {/* Node Info Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-[#1E293B] border border-gray-700 rounded-lg shadow-xl p-3 whitespace-nowrap">
                      <div className="text-white font-semibold text-sm mb-1">
                        {node.name}
                      </div>
                      {node.value && (
                        <div className="text-gray-400 text-xs">{node.value}</div>
                      )}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                        <div className="border-8 border-transparent border-t-[#1E293B]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 p-8">
              <p className="mb-2">No process diagram available</p>
              <p className="text-sm">Upload a diagram or add process nodes</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-800 bg-[#1E293B]">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {nodes.filter((n) => n.status === 'active').length}
            </div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {nodes.filter((n) => n.status === 'inactive').length}
            </div>
            <div className="text-xs text-gray-400">Inactive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              {nodes.filter((n) => n.status === 'warning').length}
            </div>
            <div className="text-xs text-gray-400">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {nodes.filter((n) => n.status === 'error').length}
            </div>
            <div className="text-xs text-gray-400">Errors</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
