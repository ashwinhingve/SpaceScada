import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ListOptions,
} from '@/types/entities';
import { toast } from 'sonner';

export function useProjects(options?: ListOptions) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    const response = await apiClient.getProjects(options);
    if (response.success && response.data) {
      setProjects(response.data);
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch projects');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [JSON.stringify(options)]);

  return { projects, loading, error, refetch: fetchProjects };
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      const response = await apiClient.getProject(id);
      if (response.success && response.data) {
        setProject(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch project');
      }
      setLoading(false);
    };

    fetchProject();
  }, [id]);

  return { project, loading, error };
}

export function useCreateProject() {
  const [loading, setLoading] = useState(false);

  const createProject = async (data: CreateProjectInput) => {
    setLoading(true);
    const response = await apiClient.createProject(data);
    setLoading(false);

    if (response.success) {
      toast.success('Project created successfully');
      return response.data;
    } else {
      toast.error(response.error || 'Failed to create project');
      throw new Error(response.error);
    }
  };

  return { createProject, loading };
}

export function useUpdateProject() {
  const [loading, setLoading] = useState(false);

  const updateProject = async (id: string, data: UpdateProjectInput) => {
    setLoading(true);
    const response = await apiClient.updateProject(id, data);
    setLoading(false);

    if (response.success) {
      toast.success('Project updated successfully');
      return response.data;
    } else {
      toast.error(response.error || 'Failed to update project');
      throw new Error(response.error);
    }
  };

  return { updateProject, loading };
}

export function useDeleteProject() {
  const [loading, setLoading] = useState(false);

  const deleteProject = async (id: string) => {
    setLoading(true);
    const response = await apiClient.deleteProject(id);
    setLoading(false);

    if (response.success) {
      toast.success('Project deleted successfully');
    } else {
      toast.error(response.error || 'Failed to delete project');
      throw new Error(response.error);
    }
  };

  return { deleteProject, loading };
}
