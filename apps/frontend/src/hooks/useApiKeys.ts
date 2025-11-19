import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { ApiKey, CreateApiKeyInput } from '@/types/entities';
import { toast } from 'sonner';

export function useApiKeys(projectId?: string) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    setLoading(true);
    const response = await apiClient.getApiKeys(projectId);
    if (response.success && response.data) {
      setApiKeys(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch API keys');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApiKeys();
  }, [projectId]);

  return { apiKeys, loading, error, refetch: fetchApiKeys };
}

export function useCreateApiKey() {
  const [loading, setLoading] = useState(false);

  const createApiKey = async (data: CreateApiKeyInput) => {
    setLoading(true);
    const response = await apiClient.createApiKey(data);
    setLoading(false);

    if (response.success) {
      toast.success('API key created successfully');
      return response.data;
    } else {
      toast.error(response.error || 'Failed to create API key');
      throw new Error(response.error);
    }
  };

  return { createApiKey, loading };
}

export function useDeleteApiKey() {
  const [loading, setLoading] = useState(false);

  const deleteApiKey = async (id: string) => {
    setLoading(true);
    const response = await apiClient.deleteApiKey(id);
    setLoading(false);

    if (response.success) {
      toast.success('API key deleted successfully');
    } else {
      toast.error(response.error || 'Failed to delete API key');
      throw new Error(response.error);
    }
  };

  return { deleteApiKey, loading };
}
