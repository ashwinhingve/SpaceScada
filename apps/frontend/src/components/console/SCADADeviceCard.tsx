'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface SCADADeviceCardProps {
  deviceId: string;
  name: string;
  type: 'sensor' | 'actuator' | 'controller' | 'gateway';
  status: 'online' | 'offline' | 'warning' | 'error';
  imageUrl?: string;
  lastUpdate?: string;
  metrics?: {
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
  onClick?: () => void;
}

export function SCADADeviceCard({
  deviceId,
  name,
  type,
  status,
  imageUrl,
  lastUpdate,
  metrics = [],
  onClick,
}: SCADADeviceCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'border-green-500/50 bg-green-500/5';
      case 'offline':
        return 'border-gray-500/50 bg-gray-500/5';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/5';
      case 'error':
        return 'border-red-500/50 bg-red-500/5';
      default:
        return 'border-gray-500/50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-gray-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-400" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={`bg-[#1E293B] border-2 ${getStatusColor()} hover:shadow-lg transition-all cursor-pointer group overflow-hidden`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon()}
              <h3 className="text-white font-semibold truncate">{name}</h3>
            </div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">{type}</p>
            <p className="text-gray-500 text-xs mt-1">ID: {deviceId}</p>
          </div>

          {/* Status Indicator */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                status === 'online'
                  ? 'bg-green-500/20 text-green-400'
                  : status === 'offline'
                  ? 'bg-gray-500/20 text-gray-400'
                  : status === 'warning'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {status.toUpperCase()}
            </span>
            {lastUpdate && (
              <span className="text-xs text-gray-500">{lastUpdate}</span>
            )}
          </div>
        </div>

        {/* Device Image */}
        {imageUrl && (
          <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-[#0F172A] border border-gray-800">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Metrics */}
        {metrics.length > 0 && (
          <div className="space-y-2">
            <div className="h-px bg-gray-800" />
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-[#0F172A] rounded p-2 border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{metric.label}</span>
                    {metric.trend && getTrendIcon(metric.trend)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-semibold">
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-xs text-gray-500">{metric.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wifi className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">Signal</span>
            </div>
            <div className="flex items-center gap-1">
              {status === 'online' ? (
                <>
                  <div className="w-1 h-3 bg-green-500 rounded" />
                  <div className="w-1 h-4 bg-green-500 rounded" />
                  <div className="w-1 h-5 bg-green-500 rounded" />
                  <div className="w-1 h-6 bg-green-500 rounded" />
                </>
              ) : (
                <>
                  <div className="w-1 h-3 bg-gray-700 rounded" />
                  <div className="w-1 h-4 bg-gray-700 rounded" />
                  <div className="w-1 h-5 bg-gray-700 rounded" />
                  <div className="w-1 h-6 bg-gray-700 rounded" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
