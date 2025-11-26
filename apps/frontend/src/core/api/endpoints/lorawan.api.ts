/**
 * LoRaWAN API Endpoints
 * Handles all LoRaWAN operations: applications, gateways, devices, downlinks
 */

import { apiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface LoRaWANApplication {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoRaWANGateway {
  id: string;
  name: string;
  description?: string;
  gateway_id: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  status: 'online' | 'offline' | 'error';
  last_seen?: Date;
  created_at: Date;
}

export interface LoRaWANDevice {
  id: string;
  name: string;
  description?: string;
  dev_eui: string;
  application_id: string;
  device_profile_id?: string;
  status: 'active' | 'inactive' | 'pending';
  activation_mode: 'OTAA' | 'ABP';
  keys?: {
    app_key?: string;
    nwk_s_key?: string;
    app_s_key?: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface DeviceDownlink {
  dev_eui: string;
  fport: number;
  data: string; // base64 encoded
  confirmed?: boolean;
  priority?: 'NORMAL' | 'HIGH';
}

export interface DeviceMetrics {
  dev_eui: string;
  uplink_count: number;
  downlink_count: number;
  error_count: number;
  last_uplink?: Date;
  average_rssi?: number;
  average_snr?: number;
  gateway_count?: number;
}

// ============================================================================
// Applications API
// ============================================================================

export const lorawanApplicationsAPI = {
  /**
   * Get all applications
   */
  getAll: async (): Promise<LoRaWANApplication[]> => {
    const response: any = await apiClient.get('/api/lorawan/applications');
    return response.data || response || [];
  },

  /**
   * Get application by ID
   */
  getById: async (id: string): Promise<LoRaWANApplication> => {
    const response: any = await apiClient.get(`/api/lorawan/applications/${id}`);
    return response.data || response;
  },

  /**
   * Create new application
   */
  create: async (data: Partial<LoRaWANApplication>): Promise<LoRaWANApplication> => {
    const response: any = await apiClient.post('/api/lorawan/applications', data);
    return response.data || response;
  },

  /**
   * Update application
   */
  update: async (id: string, data: Partial<LoRaWANApplication>): Promise<LoRaWANApplication> => {
    const response: any = await apiClient.put(`/api/lorawan/applications/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete application
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/lorawan/applications/${id}`);
  },
};

// ============================================================================
// Gateways API
// ============================================================================

export const lorawanGatewaysAPI = {
  /**
   * Get all gateways
   */
  getAll: async (): Promise<LoRaWANGateway[]> => {
    const response: any = await apiClient.get('/api/lorawan/gateways');
    return response.data || response || [];
  },

  /**
   * Get gateway by ID
   */
  getById: async (id: string): Promise<LoRaWANGateway> => {
    const response: any = await apiClient.get(`/api/lorawan/gateways/${id}`);
    return response.data || response;
  },

  /**
   * Create new gateway
   */
  create: async (data: Partial<LoRaWANGateway>): Promise<LoRaWANGateway> => {
    const response: any = await apiClient.post('/api/lorawan/gateways', data);
    return response.data || response;
  },

  /**
   * Update gateway
   */
  update: async (id: string, data: Partial<LoRaWANGateway>): Promise<LoRaWANGateway> => {
    const response: any = await apiClient.put(`/api/lorawan/gateways/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete gateway
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/lorawan/gateways/${id}`);
  },
};

// ============================================================================
// Devices API
// ============================================================================

export const lorawanDevicesAPI = {
  /**
   * Get all devices
   */
  getAll: async (params?: { applicationId?: string; status?: string }): Promise<LoRaWANDevice[]> => {
    const response: any = await apiClient.get('/api/lorawan/devices', params);
    return response.data || response || [];
  },

  /**
   * Get device by ID
   */
  getById: async (id: string): Promise<LoRaWANDevice> => {
    const response: any = await apiClient.get(`/api/lorawan/devices/${id}`);
    return response.data || response;
  },

  /**
   * Create new device
   */
  create: async (data: Partial<LoRaWANDevice>): Promise<LoRaWANDevice> => {
    const response: any = await apiClient.post('/api/lorawan/devices', data);
    return response.data || response;
  },

  /**
   * Update device
   */
  update: async (id: string, data: Partial<LoRaWANDevice>): Promise<LoRaWANDevice> => {
    const response: any = await apiClient.put(`/api/lorawan/devices/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete device
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/lorawan/devices/${id}`);
  },

  /**
   * Send downlink message
   */
  sendDownlink: async (data: DeviceDownlink): Promise<void> => {
    await apiClient.post('/api/lorawan/downlinks', data);
  },

  /**
   * Get device metrics
   */
  getMetrics: async (devEui: string): Promise<DeviceMetrics> => {
    const response: any = await apiClient.get(`/api/lorawan/devices/${devEui}/metrics`);
    return response.data || response;
  },
};

// ============================================================================
// Unified Export
// ============================================================================

export const lorawanAPI = {
  applications: lorawanApplicationsAPI,
  gateways: lorawanGatewaysAPI,
  devices: lorawanDevicesAPI,
};
