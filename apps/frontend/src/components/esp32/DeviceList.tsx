'use client';

import { useESP32Devices } from '@/hooks/useESP32Devices';
import { DeviceCard } from './DeviceCard';
import { esp32API } from '@/lib/esp32-api';

export function DeviceList() {
  const { devices, loading, error, refetch } = useESP32Devices();

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      await esp32API.deleteDevice(deviceId);
      await refetch();
    } catch (err) {
      console.error('Failed to delete device:', err);
      alert('Failed to delete device. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Devices</h3>
        <p className="text-red-600 dark:text-red-300">{error.message}</p>
        <button
          onClick={refetch}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No devices found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by registering your first ESP32 device.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} onDelete={handleDelete} />
      ))}
    </div>
  );
}
