import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseDevicesOptions {
  fetchFn: () => Promise<any[]>;
  deleteFn?: (id: string) => Promise<any>;
  autoFetch?: boolean;
}

export function useDevices({ fetchFn, deleteFn, autoFetch = true }: UseDevicesOptions) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFn();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch devices';
      setError(message);
      toast.error(message);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  const deleteDevice = useCallback(async (id: string) => {
    if (!deleteFn) {
      toast.error('Delete operation not supported');
      return;
    }

    try {
      await deleteFn(id);
      toast.success('Device deleted successfully');
      await fetchDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete device';
      toast.error(message);
      throw err;
    }
  }, [deleteFn, fetchDevices]);

  useEffect(() => {
    if (autoFetch) {
      fetchDevices();
    }
  }, [fetchDevices, autoFetch]);

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    deleteDevice,
  };
}