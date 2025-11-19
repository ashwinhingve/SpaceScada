import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  ListOptions,
} from '@/types/entities';
import { toast } from 'sonner';

export function useOrganizations(options?: ListOptions) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setLoading(true);
    const response = await apiClient.getOrganizations(options);
    if (response.success && response.data) {
      setOrganizations(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch organizations');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
  }, [JSON.stringify(options)]);

  return { organizations, loading, error, refetch: fetchOrganizations };
}

export function useOrganization(id: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true);
      const response = await apiClient.getOrganization(id);
      if (response.success && response.data) {
        setOrganization(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch organization');
      }
      setLoading(false);
    };

    fetchOrganization();
  }, [id]);

  return { organization, loading, error };
}

export function useCreateOrganization() {
  const [loading, setLoading] = useState(false);

  const createOrganization = async (data: CreateOrganizationInput) => {
    setLoading(true);
    const response = await apiClient.createOrganization(data);
    setLoading(false);

    if (response.success) {
      toast.success('Organization created successfully');
      return response.data;
    } else {
      toast.error(response.error || 'Failed to create organization');
      throw new Error(response.error);
    }
  };

  return { createOrganization, loading };
}

export function useUpdateOrganization() {
  const [loading, setLoading] = useState(false);

  const updateOrganization = async (id: string, data: UpdateOrganizationInput) => {
    setLoading(true);
    const response = await apiClient.updateOrganization(id, data);
    setLoading(false);

    if (response.success) {
      toast.success('Organization updated successfully');
      return response.data;
    } else {
      toast.error(response.error || 'Failed to update organization');
      throw new Error(response.error);
    }
  };

  return { updateOrganization, loading };
}

export function useDeleteOrganization() {
  const [loading, setLoading] = useState(false);

  const deleteOrganization = async (id: string) => {
    setLoading(true);
    const response = await apiClient.deleteOrganization(id);
    setLoading(false);

    if (response.success) {
      toast.success('Organization deleted successfully');
    } else {
      toast.error(response.error || 'Failed to delete organization');
      throw new Error(response.error);
    }
  };

  return { deleteOrganization, loading };
}
