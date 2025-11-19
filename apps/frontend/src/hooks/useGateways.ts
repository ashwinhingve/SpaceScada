import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type {
  Gateway,
  CreateGatewayInput,
  UpdateGatewayInput,
  ListOptions,
} from '@/types/entities';
import { toast } from 'sonner';

export function useGateways(options?: ListOptions) {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGateways = async () => {
    setLoading(true);
    const response = await apiClient.getGateways(options);
    if (response.success && response.data) {
      setGateways(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch gateways');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGateways();
  }, [JSON.stringify(options)]);

  return { gateways, loading, error, refetch: fetchGateways };
}

export function useGateway(id: string) {
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGateway = async () => {
      setLoading(true);
      const response = await apiClient.getGateway(id);
      if (response.success && response.data) {
        setGateway(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch gateway');
      }
      setLoading(false);
    };

    fetchGateway();
  }, [id]);

  return { gateway, loading, error };
}

export function useCreateGateway() {
  const [loading, setLoading] = useState(false);

  const createGateway = async (data: CreateGatewayInput) => {
    setLoading(true);
    const response = await apiClient.createGateway(data);
    setLoading(false);

    if (response.success) {
      toast.success('Gateway registered successfully');
      return response.data;
    } else {
      toast.error(response.error || 'Failed to register gateway');
      throw new Error(response.error);
    }
  };

  return { createGateway, loading };
}

export function useUpdateGateway() {
  const [loading, setLoading] = useState(false);

  const updateGateway = async (id: string, data: UpdateGatewayInput) => {
    setLoading(true);
    const response = await apiClient.updateGateway(id, data);
    setLoading(false);

    if (response.success) {
      toast.success('Gateway updated successfully');
      return response.data;
    } else {
      toast.error(response.error || 'Failed to update gateway');
      throw new Error(response.error);
    }
  };

  return { updateGateway, loading };
}

export function useDeleteGateway() {
  const [loading, setLoading] = useState(false);

  const deleteGateway = async (id: string) => {
    setLoading(true);
    const response = await apiClient.deleteGateway(id);
    setLoading(false);

    if (response.success) {
      toast.success('Gateway deleted successfully');
    } else {
      toast.error(response.error || 'Failed to delete gateway');
      throw new Error(response.error);
    }
  };

  return { deleteGateway, loading };
}
