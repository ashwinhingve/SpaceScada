import { useState, useEffect, useCallback } from 'react';
import { ESP32SensorData } from '@webscada/shared-types';
import { esp32API } from '@/lib/esp32-api';

export interface UseESP32SensorDataResult {
  sensorData: ESP32SensorData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and subscribe to real-time sensor data for a device
 */
export function useESP32SensorData(deviceId: string | null): UseESP32SensorDataResult {
  const [sensorData, setSensorData] = useState<ESP32SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSensorData = useCallback(async () => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await esp32API.getDeviceSensorData(deviceId);
      setSensorData(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch sensor data:', err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Fetch initial data
  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  // Set up polling for real-time updates (fallback for WebSocket)
  useEffect(() => {
    if (!deviceId) return;

    const interval = setInterval(() => {
      fetchSensorData();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [deviceId, fetchSensorData]);

  // TODO: Add WebSocket integration for true real-time updates
  // This will be implemented when WebSocket context is available globally

  return {
    sensorData,
    loading,
    error,
    refetch: fetchSensorData,
  };
}
