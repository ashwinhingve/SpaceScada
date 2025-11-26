/**
 * GSM Device API Endpoints
 * Handles all GSM/ESP32 device operations including SMS, GPS, network status, and commands
 */

import { apiClient } from '../client';
import type {
  GSMDevice,
  GSMDeviceConfig,
  GSMDeviceStatus,
  GSMNetworkStatus,
  GPSLocation,
  SMSMessage,
  SendSMSRequest,
  SendSMSResponse,
  GSMCommand,
} from '@webscada/shared-types';

// ============================================================================
// Types
// ============================================================================

export interface SMSFilter {
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface CommandHistory extends GSMCommand {
  executedAt?: Date;
  responseTime?: number;
}

export interface NetworkStatusHistory extends GSMNetworkStatus {
  timestamp: Date;
}

export interface GPSHistoryParams {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Devices API
// ============================================================================

export const gsmDevicesAPI = {
  /**
   * Get all GSM devices
   */
  getAll: async (): Promise<GSMDevice[]> => {
    const response: any = await apiClient.get('/gsm/devices');
    return response.data || response || [];
  },

  /**
   * Get GSM device by ID
   */
  getById: async (id: string): Promise<GSMDevice> => {
    const response: any = await apiClient.get(`/gsm/devices/${id}`);
    return response.data || response;
  },

  /**
   * Create new GSM device
   */
  create: async (data: Partial<GSMDevice>): Promise<GSMDevice> => {
    const response: any = await apiClient.post('/gsm/devices', data);
    return response.data || response;
  },

  /**
   * Update GSM device
   */
  update: async (id: string, data: Partial<GSMDevice>): Promise<GSMDevice> => {
    const response: any = await apiClient.put(`/gsm/devices/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete GSM device
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/gsm/devices/${id}`);
  },
};

// ============================================================================
// SMS API
// ============================================================================

export const gsmSMSAPI = {
  /**
   * Send SMS message
   */
  send: async (deviceId: string, data: SendSMSRequest): Promise<SendSMSResponse> => {
    const response: any = await apiClient.post(`/gsm/devices/${deviceId}/sms/send`, data);
    return response.data || response;
  },

  /**
   * Get SMS messages with optional filters
   */
  getAll: async (deviceId: string, filters?: SMSFilter): Promise<SMSMessage[]> => {
    const response: any = await apiClient.get(`/gsm/devices/${deviceId}/sms`, filters);
    return response.data || response || [];
  },

  /**
   * Sync SMS messages from device
   */
  sync: async (deviceId: string): Promise<{ count: number }> => {
    const response: any = await apiClient.post(`/gsm/devices/${deviceId}/sms/sync`, {});
    return response.data || response;
  },
};

// ============================================================================
// GPS API
// ============================================================================

export const gsmGPSAPI = {
  /**
   * Get current GPS location
   */
  getCurrent: async (deviceId: string): Promise<GPSLocation> => {
    const response: any = await apiClient.get(`/gsm/devices/${deviceId}/gps`);
    return response.data || response;
  },

  /**
   * Get GPS location history
   */
  getHistory: async (deviceId: string, params?: GPSHistoryParams): Promise<GPSLocation[]> => {
    const response: any = await apiClient.get(`/gsm/devices/${deviceId}/gps/history`, params);
    return response.data || response || [];
  },
};

// ============================================================================
// Network API
// ============================================================================

export const gsmNetworkAPI = {
  /**
   * Get current network status
   */
  getStatus: async (deviceId: string): Promise<GSMNetworkStatus> => {
    const response: any = await apiClient.get(`/gsm/devices/${deviceId}/network/status`);
    return response.data || response;
  },

  /**
   * Get network status history
   */
  getHistory: async (
    deviceId: string,
    params?: GPSHistoryParams
  ): Promise<NetworkStatusHistory[]> => {
    const response: any = await apiClient.get(`/gsm/devices/${deviceId}/network/history`, params);
    return response.data || response || [];
  },
};

// ============================================================================
// Commands API
// ============================================================================

export const gsmCommandsAPI = {
  /**
   * Send command to device
   */
  send: async (deviceId: string, command: GSMCommand): Promise<CommandHistory> => {
    const response: any = await apiClient.post(`/gsm/devices/${deviceId}/commands`, command);
    return response.data || response;
  },

  /**
   * Get command execution history
   */
  getHistory: async (deviceId: string, params?: GPSHistoryParams): Promise<CommandHistory[]> => {
    const response: any = await apiClient.get(`/gsm/devices/${deviceId}/commands/history`, params);
    return response.data || response || [];
  },
};

// ============================================================================
// Unified Export
// ============================================================================

export const gsmAPI = {
  devices: gsmDevicesAPI,
  sms: gsmSMSAPI,
  gps: gsmGPSAPI,
  network: gsmNetworkAPI,
  commands: gsmCommandsAPI,
};
