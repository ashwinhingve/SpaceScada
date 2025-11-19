/**
 * API Client for WebSCADA Application
 * Provides methods for interacting with all entity types
 */

import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  Gateway,
  CreateGatewayInput,
  UpdateGatewayInput,
  Device,
  CreateDeviceInput,
  UpdateDeviceInput,
  ApiKey,
  CreateApiKeyInput,
  Tag,
  CreateTagInput,
  UpdateTagInput,
  Alarm,
  ApiResponse,
  PaginatedResponse,
  ListOptions,
} from '@/types/entities';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || response.statusText,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Projects (Applications)
  async getProjects(options?: ListOptions): Promise<ApiResponse<Project[]>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.filters?.search) params.append('search', options.filters.search);
    if (options?.filters?.organizationId)
      params.append('organizationId', options.filters.organizationId);

    const query = params.toString();
    return this.request<Project[]>(`/api/projects${query ? `?${query}` : ''}`);
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/api/projects/${id}`);
  }

  async createProject(project: CreateProjectInput): Promise<ApiResponse<Project>> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, project: UpdateProjectInput): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Organizations
  async getOrganizations(options?: ListOptions): Promise<ApiResponse<Organization[]>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.filters?.search) params.append('search', options.filters.search);

    const query = params.toString();
    return this.request<Organization[]>(`/api/organizations${query ? `?${query}` : ''}`);
  }

  async getOrganization(id: string): Promise<ApiResponse<Organization>> {
    return this.request<Organization>(`/api/organizations/${id}`);
  }

  async createOrganization(
    organization: CreateOrganizationInput
  ): Promise<ApiResponse<Organization>> {
    return this.request<Organization>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(organization),
    });
  }

  async updateOrganization(
    id: string,
    organization: UpdateOrganizationInput
  ): Promise<ApiResponse<Organization>> {
    return this.request<Organization>(`/api/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(organization),
    });
  }

  async deleteOrganization(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  // Gateways
  async getGateways(options?: ListOptions): Promise<ApiResponse<Gateway[]>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.filters?.search) params.append('search', options.filters.search);
    if (options?.filters?.protocol) params.append('protocol', options.filters.protocol);
    if (options?.filters?.organizationId)
      params.append('organizationId', options.filters.organizationId);

    const query = params.toString();
    return this.request<Gateway[]>(`/api/gateways${query ? `?${query}` : ''}`);
  }

  async getGateway(id: string): Promise<ApiResponse<Gateway>> {
    return this.request<Gateway>(`/api/gateways/${id}`);
  }

  async createGateway(gateway: CreateGatewayInput): Promise<ApiResponse<Gateway>> {
    return this.request<Gateway>('/api/gateways', {
      method: 'POST',
      body: JSON.stringify(gateway),
    });
  }

  async updateGateway(id: string, gateway: UpdateGatewayInput): Promise<ApiResponse<Gateway>> {
    return this.request<Gateway>(`/api/gateways/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gateway),
    });
  }

  async deleteGateway(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/gateways/${id}`, {
      method: 'DELETE',
    });
  }

  // Devices
  async getDevices(options?: ListOptions): Promise<ApiResponse<Device[]>> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.filters?.search) params.append('search', options.filters.search);
    if (options?.filters?.type) params.append('type', options.filters.type);
    if (options?.filters?.protocol) params.append('protocol', options.filters.protocol);
    if (options?.filters?.projectId) params.append('projectId', options.filters.projectId);
    if (options?.filters?.organizationId)
      params.append('organizationId', options.filters.organizationId);

    const query = params.toString();
    return this.request<Device[]>(`/api/devices${query ? `?${query}` : ''}`);
  }

  async getDevice(id: string): Promise<ApiResponse<Device>> {
    return this.request<Device>(`/api/devices/${id}`);
  }

  async createDevice(device: CreateDeviceInput): Promise<ApiResponse<Device>> {
    return this.request<Device>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  async updateDevice(id: string, device: UpdateDeviceInput): Promise<ApiResponse<Device>> {
    return this.request<Device>(`/api/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    });
  }

  async deleteDevice(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/devices/${id}`, {
      method: 'DELETE',
    });
  }

  // Tags
  async getTags(deviceId?: string): Promise<ApiResponse<Tag[]>> {
    const url = deviceId ? `/api/tags?deviceId=${deviceId}` : '/api/tags';
    return this.request<Tag[]>(url);
  }

  async getTag(id: string): Promise<ApiResponse<Tag>> {
    return this.request<Tag>(`/api/tags/${id}`);
  }

  async createTag(tag: CreateTagInput): Promise<ApiResponse<Tag>> {
    return this.request<Tag>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(tag),
    });
  }

  async updateTag(id: string, tag: UpdateTagInput): Promise<ApiResponse<Tag>> {
    return this.request<Tag>(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tag),
    });
  }

  async deleteTag(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/tags/${id}`, {
      method: 'DELETE',
    });
  }

  async writeTag(id: string, value: any): Promise<ApiResponse<Tag>> {
    return this.request<Tag>(`/api/tags/${id}/write`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  // API Keys
  async getApiKeys(projectId?: string): Promise<ApiResponse<ApiKey[]>> {
    const url = projectId ? `/api/api-keys?projectId=${projectId}` : '/api/api-keys';
    return this.request<ApiKey[]>(url);
  }

  async getApiKey(id: string): Promise<ApiResponse<ApiKey>> {
    return this.request<ApiKey>(`/api/api-keys/${id}`);
  }

  async createApiKey(apiKey: CreateApiKeyInput): Promise<ApiResponse<ApiKey>> {
    return this.request<ApiKey>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify(apiKey),
    });
  }

  async deleteApiKey(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  // Alarms
  async getAlarms(acknowledged?: boolean): Promise<ApiResponse<Alarm[]>> {
    const url =
      acknowledged !== undefined ? `/api/alarms?acknowledged=${acknowledged}` : '/api/alarms';
    return this.request<Alarm[]>(url);
  }

  async acknowledgeAlarm(id: string): Promise<ApiResponse<Alarm>> {
    return this.request<Alarm>(`/api/alarms/${id}/acknowledge`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_URL);
