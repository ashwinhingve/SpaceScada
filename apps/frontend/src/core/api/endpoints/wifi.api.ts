/**
 * Wi-Fi Device API Endpoints
 * Handles all Wi-Fi device operations including configuration, status, and signal monitoring
 */

import { apiClient } from '../client';
import type {
  WiFiDevice,
  WiFiDeviceConfig,
  WiFiDeviceStatus,
} from '@webscada/shared-types';

// ============================================================================
// Types
// ============================================================================

export interface WiFiDeviceParams {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface DeviceStats {
  id: string;
  uptime: number; // seconds
  average_signal_strength: number;
  packet_loss: number; // percentage
  bandwidth_usage: number; // bytes/sec
  total_messages_sent: number;
  total_messages_received: number;
  last_updated: Date;
}

export interface SignalDeviceInfo extends WiFiDevice {
  signal_strength: number;
}

// ============================================================================
// Devices API
// ============================================================================

export const wifiDevicesAPI = {
  /**
   * Get all Wi-Fi devices with optional filters
   */
  getAll: async (params?: WiFiDeviceParams): Promise<WiFiDevice[]> => {
    const response: any = await apiClient.get('/wifi/devices', params);
    return response.data || response || [];
  },

  /**
   * Get Wi-Fi device by ID
   */
  getById: async (id: string): Promise<WiFiDevice> => {
    const response: any = await apiClient.get(`/wifi/devices/${id}`);
    return response.data || response;
  },

  /**
   * Create new Wi-Fi device
   */
  create: async (data: Partial<WiFiDevice>): Promise<WiFiDevice> => {
    const response: any = await apiClient.post('/wifi/devices', data);
    return response.data || response;
  },

  /**
   * Update Wi-Fi device
   */
  update: async (id: string, data: Partial<WiFiDevice>): Promise<WiFiDevice> => {
    const response: any = await apiClient.put(`/wifi/devices/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete Wi-Fi device
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/wifi/devices/${id}`);
  },

  /**
   * Get devices by status
   */
  getByStatus: async (status: string): Promise<WiFiDevice[]> => {
    const response: any = await apiClient.get('/wifi/devices', { status });
    return response.data || response || [];
  },

  /**
   * Get devices with weak signal
   */
  getWeakSignal: async (threshold: number): Promise<SignalDeviceInfo[]> => {
    const response: any = await apiClient.get('/wifi/devices/signal/weak', { threshold });
    return response.data || response || [];
  },
};

// ============================================================================
// Status API
// ============================================================================

export const wifiStatusAPI = {
  /**
   * Update device status
   */
  update: async (id: string, status: string): Promise<WiFiDevice> => {
    const response: any = await apiClient.patch(`/wifi/devices/${id}/status`, { status });
    return response.data || response;
  },

  /**
   * Update device signal strength
   */
  updateSignal: async (id: string, strength: number): Promise<WiFiDeviceStatus> => {
    const response: any = await apiClient.patch(`/wifi/devices/${id}/signal`, { signal_strength: strength });
    return response.data || response;
  },
};

// ============================================================================
// Statistics API
// ============================================================================

export const wifiStatsAPI = {
  /**
   * Get device statistics
   */
  get: async (id: string): Promise<DeviceStats> => {
    const response: any = await apiClient.get(`/wifi/devices/${id}/stats`);
    return response.data || response;
  },
};

// ============================================================================
// Unified Export
// ============================================================================

export const wifiAPI = {
  devices: wifiDevicesAPI,
  status: wifiStatusAPI,
  stats: wifiStatsAPI,
};
