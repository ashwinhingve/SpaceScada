/**
 * Device API Service
 * Unified API for all device protocols
 */

import type {
  Device,
  CreateDeviceDto,
  DeviceFilters,
  DeviceSort,
  DeviceListResponse,
  DeviceControlAction,
} from '../types/device.types';

// API client would be imported from lib
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class DeviceApiService {
  /**
   * Get all devices with optional filters
   */
  async getAll(filters?: DeviceFilters, sort?: DeviceSort): Promise<DeviceListResponse> {
    const params = new URLSearchParams();

    if (filters?.protocol) {
      params.append('protocol', filters.protocol.join(','));
    }
    if (filters?.status) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortDirection', sort.direction);
    }

    const response = await fetch(`${API_BASE}/api/devices?${params}`);
    if (!response.ok) throw new Error('Failed to fetch devices');
    return response.json();
  }

  /**
   * Get device by ID
   */
  async getById(id: string): Promise<Device> {
    const response = await fetch(`${API_BASE}/api/devices/${id}`);
    if (!response.ok) throw new Error('Failed to fetch device');
    return response.json();
  }

  /**
   * Create new device
   */
  async create(data: CreateDeviceDto): Promise<Device> {
    const response = await fetch(`${API_BASE}/api/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create device');
    return response.json();
  }

  /**
   * Update device
   */
  async update(id: string, data: Partial<Device>): Promise<Device> {
    const response = await fetch(`${API_BASE}/api/devices/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update device');
    return response.json();
  }

  /**
   * Delete device
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/devices/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete device');
  }

  /**
   * Send control command to device
   */
  async control(action: DeviceControlAction): Promise<void> {
    const response = await fetch(`${API_BASE}/api/devices/${action.deviceId}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });
    if (!response.ok) throw new Error('Failed to send control command');
  }

  /**
   * Get device metrics history
   */
  async getMetrics(
    deviceId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<any[]> {
    const params = new URLSearchParams({
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
    });

    const response = await fetch(`${API_BASE}/api/devices/${deviceId}/metrics?${params}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  }
}

export const deviceApi = new DeviceApiService();
