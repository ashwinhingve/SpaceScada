'use client';

import { ESP32Device } from '@webscada/shared-types';
import Link from 'next/link';

interface DeviceCardProps {
  device: ESP32Device;
  onDelete?: (deviceId: string) => void;
}

export function DeviceCard({ device, onDelete }: DeviceCardProps) {
  const isOnline = device.status === 'ONLINE';

  const getStatusColor = () => {
    switch (device.status) {
      case 'ONLINE':
        return 'bg-green-500';
      case 'OFFLINE':
        return 'bg-gray-500';
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return 'Never';
    const lastSeen = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{device.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{device.id}</p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {device.esp32Config?.sensorType || 'Unknown'}
        </span>
      </div>

      {/* Sensor Data */}
      {(device as any).sensorData && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {(device as any).sensorData.temperature !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Temperature</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {(device as any).sensorData.temperature.toFixed(1)}°C
              </p>
            </div>
          )}
          {(device as any).sensorData.humidity !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Humidity</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {(device as any).sensorData.humidity.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* LED Status */}
      {(device as any).controlState && (
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-4 h-4 rounded-full ${
              (device as any).controlState.ledState ? 'bg-yellow-400' : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            LED {(device as any).controlState.ledState ? 'On' : 'Off'}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last seen: {formatLastSeen(device.lastSeen)}
        </span>
        <div className="flex gap-2">
          <Link
            href={`/esp32/devices/${device.id}`}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(device.id)}
              className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
