'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Thermometer,
  Zap,
} from 'lucide-react';

interface DeviceStatus {
  deviceId: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  uptime?: string;
  cpu?: number;
  memory?: number;
  temperature?: number;
  power?: number;
  lastSeen?: string;
  thumbnail?: string;
}

interface DeviceStatusPanelProps {
  devices: DeviceStatus[];
  title?: string;
  showThumbnails?: boolean;
  compactView?: boolean;
  onDeviceClick?: (deviceId: string) => void;
}

export function DeviceStatusPanel({
  devices,
  title = 'Device Status Monitor',
  showThumbnails = true,
  compactView = false,
  onDeviceClick,
}: DeviceStatusPanelProps) {
  const getStatusIcon = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'maintenance':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: DeviceStatus['status']) => {
    const baseClasses = 'text-xs font-medium px-2 py-1 rounded uppercase';
    switch (status) {
      case 'online':
        return `${baseClasses} bg-green-500/20 text-green-400`;
      case 'offline':
        return `${baseClasses} bg-gray-500/20 text-gray-400`;
      case 'maintenance':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
      case 'error':
        return `${baseClasses} bg-red-500/20 text-red-400`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400`;
    }
  };

  const getHealthPercentage = (device: DeviceStatus) => {
    if (device.status === 'offline') return 0;
    if (device.status === 'error') return 25;
    if (device.status === 'maintenance') return 75;

    // Calculate based on metrics
    let health = 100;
    if (device.cpu && device.cpu > 80) health -= 20;
    if (device.memory && device.memory > 80) health -= 20;
    if (device.temperature && device.temperature > 70) health -= 20;

    return Math.max(0, health);
  };

  return (
    <Card className="bg-[#1E293B] border-gray-800">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-400">
                {devices.filter((d) => d.status === 'online').length} Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-400">
                {devices.filter((d) => d.status === 'error').length} Errors
              </span>
            </div>
          </div>
        </div>

        {/* Device List */}
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.deviceId}
              className="bg-[#0F172A] border border-gray-800 rounded-lg p-4 hover:border-blue-500/30 transition-all cursor-pointer group"
              onClick={() => onDeviceClick?.(device.deviceId)}
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                {showThumbnails && device.thumbnail && (
                  <div className="relative w-16 h-16 rounded bg-gray-900 border border-gray-800 flex-shrink-0 overflow-hidden">
                    <Image
                      src={device.thumbnail}
                      alt={device.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform"
                      sizes="64px"
                    />
                  </div>
                )}

                {/* Device Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getStatusIcon(device.status)}
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {device.name}
                        </h3>
                        <p className="text-gray-400 text-xs">{device.type}</p>
                      </div>
                    </div>
                    <span className={getStatusBadge(device.status)}>
                      {device.status}
                    </span>
                  </div>

                  {!compactView && (
                    <>
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {device.cpu !== undefined && (
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-blue-400" />
                            <div>
                              <div className="text-xs text-gray-400">CPU</div>
                              <div className="text-sm text-white font-medium">
                                {device.cpu}%
                              </div>
                            </div>
                          </div>
                        )}

                        {device.memory !== undefined && (
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-purple-400" />
                            <div>
                              <div className="text-xs text-gray-400">Memory</div>
                              <div className="text-sm text-white font-medium">
                                {device.memory}%
                              </div>
                            </div>
                          </div>
                        )}

                        {device.temperature !== undefined && (
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-orange-400" />
                            <div>
                              <div className="text-xs text-gray-400">Temp</div>
                              <div className="text-sm text-white font-medium">
                                {device.temperature}°C
                              </div>
                            </div>
                          </div>
                        )}

                        {device.power !== undefined && (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <div>
                              <div className="text-xs text-gray-400">Power</div>
                              <div className="text-sm text-white font-medium">
                                {device.power}W
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Health Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">System Health</span>
                          <span className="text-white font-medium">
                            {getHealthPercentage(device)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              getHealthPercentage(device) > 75
                                ? 'bg-green-500'
                                : getHealthPercentage(device) > 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${getHealthPercentage(device)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-800">
                    {device.uptime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Uptime: {device.uptime}
                      </div>
                    )}
                    {device.lastSeen && (
                      <div>Last seen: {device.lastSeen}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No devices found</p>
            <p className="text-sm mt-1">Add devices to start monitoring</p>
          </div>
        )}
      </div>
    </Card>
  );
}
