import { useState, useEffect, useCallback } from 'react';
import { ESP32Device } from '@webscada/shared-types';
import { esp32API } from '@/lib/esp32-api';

export interface UseESP32DevicesResult {
  devices: ESP32Device[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage ESP32 devices list
 */
export function useESP32Devices(): UseESP32DevicesResult {
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await esp32API.listDevices();
      setDevices(data);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch ESP32 devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // TODO: Add WebSocket integration for real-time device status updates
  // This will be implemented when WebSocket context is available globally

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
  };
}
