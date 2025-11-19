'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ESP32Device, ESP32SensorData } from '@webscada/shared-types';
import { esp32API, SensorDataHistoryParams } from '@/lib/esp32-api';
import { useESP32SensorData } from '@/hooks/useESP32SensorData';
import { SensorStats } from '@/components/esp32/SensorStats';
import { SensorChart } from '@/components/esp32/SensorChart';
import { ControlPanel } from '@/components/esp32/ControlPanel';

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<ESP32Device | null>(null);
  const [history, setHistory] = useState<ESP32SensorData[]>([]);
  const [loadingDevice, setLoadingDevice] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h');

  const { sensorData, loading: loadingSensorData } = useESP32SensorData(deviceId);

  // Fetch device details
  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoadingDevice(true);
        const data = await esp32API.getDevice(deviceId);
        setDevice(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingDevice(false);
      }
    };

    fetchDevice();
  }, [deviceId]);

  // Fetch sensor history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const endTime = new Date();
        const startTime = new Date();

        switch (timeRange) {
          case '1h':
            startTime.setHours(endTime.getHours() - 1);
            break;
          case '6h':
            startTime.setHours(endTime.getHours() - 6);
            break;
          case '24h':
            startTime.setDate(endTime.getDate() - 1);
            break;
          case '7d':
            startTime.setDate(endTime.getDate() - 7);
            break;
        }

        const params: SensorDataHistoryParams = {
          startTime,
          endTime,
          limit: 1000,
        };

        const result = await esp32API.getDeviceSensorHistory(deviceId, params);
        setHistory(result.history.reverse()); // Reverse to show oldest first
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [deviceId, timeRange]);

  if (loadingDevice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
              Error Loading Device
            </h3>
            <p className="text-red-600 dark:text-red-300">{error || 'Device not found'}</p>
            <Link
              href="/esp32"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Devices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = device.status === 'ONLINE';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/esp32"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Devices
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
                />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{device.name}</h1>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Device ID: {device.id} • {device.esp32Config.sensorType} Sensor
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isOnline
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {device.status}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor Stats */}
        <div className="mb-8">
          <SensorStats sensorData={sensorData} loading={loadingSensorData} />
        </div>

        {/* Control Panel */}
        <div className="mb-8">
          <ControlPanel device={device} />
        </div>

        {/* Historical Data */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Historical Data</h2>
          <div className="flex gap-2">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SensorChart
              data={history}
              dataKey="temperature"
              title="Temperature"
              unit="°C"
              color="#ef4444"
            />
            <SensorChart
              data={history}
              dataKey="humidity"
              title="Humidity"
              unit="%"
              color="#3b82f6"
            />
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No historical data available for this time range.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
