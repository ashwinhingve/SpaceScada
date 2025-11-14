// API Client - currently unused, kept for future use
// Use dashboard-specific types and store instead

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface Device {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface Tag {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface Alarm {
  id: string;
  message: string;
  [key: string]: unknown;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Devices
  async getDevices(): Promise<ApiResponse<Device[]>> {
    return this.request<Device[]>('/api/devices');
  }

  async getDevice(id: string): Promise<ApiResponse<Device>> {
    return this.request<Device>(`/api/devices/${id}`);
  }

  async createDevice(device: Partial<Device>): Promise<ApiResponse<Device>> {
    return this.request<Device>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  async updateDevice(
    id: string,
    device: Partial<Device>
  ): Promise<ApiResponse<Device>> {
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

  // Alarms
  async getAlarms(acknowledged?: boolean): Promise<ApiResponse<Alarm[]>> {
    const url =
      acknowledged !== undefined
        ? `/api/alarms?acknowledged=${acknowledged}`
        : '/api/alarms';
    return this.request<Alarm[]>(url);
  }

  async acknowledgeAlarm(id: string): Promise<ApiResponse<Alarm>> {
    return this.request<Alarm>(`/api/alarms/${id}/acknowledge`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient(API_URL);
