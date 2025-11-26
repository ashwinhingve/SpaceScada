/**
 * Bluetooth Device API Endpoints
 * Handles all Bluetooth device operations including BLE and classic Bluetooth management
 */

import { apiClient } from '../client';
import type {
  BluetoothDevice,
  BluetoothDeviceConfig,
  BluetoothDeviceStatus,
  BluetoothProtocol,
} from '@webscada/shared-types';

// ============================================================================
// Types
// ============================================================================

export interface BluetoothDeviceParams {
  status?: string;
  protocol?: BluetoothProtocol;
  limit?: number;
  offset?: number;
}

export interface ProximityInfo {
  id: string;
  name: string;
  rssi: number;
  distance_estimate: number; // meters
  proximity_zone: 'immediate' | 'near' | 'far' | 'unknown';
  last_updated: Date;
}

export interface BatteryInfo {
  id: string;
  name: string;
  battery_level: number; // 0-100
  battery_voltage?: number;
  last_updated: Date;
}

export interface SignalInfo {
  id: string;
  name: string;
  signal_strength: number; // 0-100
  rssi: number; // dBm
  last_updated: Date;
}

// ============================================================================
// Devices API
// ============================================================================

export const bluetoothDevicesAPI = {
  /**
   * Get all Bluetooth devices with optional filters
   */
  getAll: async (params?: BluetoothDeviceParams): Promise<BluetoothDevice[]> => {
    const response: any = await apiClient.get('/bluetooth/devices', params);
    return response.data || response || [];
  },

  /**
   * Get Bluetooth device by ID
   */
  getById: async (id: string): Promise<BluetoothDevice> => {
    const response: any = await apiClient.get(`/bluetooth/devices/${id}`);
    return response.data || response;
  },

  /**
   * Create new Bluetooth device
   */
  create: async (data: Partial<BluetoothDevice>): Promise<BluetoothDevice> => {
    const response: any = await apiClient.post('/bluetooth/devices', data);
    return response.data || response;
  },

  /**
   * Update Bluetooth device
   */
  update: async (id: string, data: Partial<BluetoothDevice>): Promise<BluetoothDevice> => {
    const response: any = await apiClient.put(`/bluetooth/devices/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete Bluetooth device
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/bluetooth/devices/${id}`);
  },

  /**
   * Get devices by status
   */
  getByStatus: async (status: string): Promise<BluetoothDevice[]> => {
    const response: any = await apiClient.get('/bluetooth/devices', { status });
    return response.data || response || [];
  },

  /**
   * Get devices by protocol
   */
  getByProtocol: async (protocol: BluetoothProtocol): Promise<BluetoothDevice[]> => {
    const response: any = await apiClient.get('/bluetooth/devices', { protocol });
    return response.data || response || [];
  },
};

// ============================================================================
// Status API
// ============================================================================

export const bluetoothStatusAPI = {
  /**
   * Update device status
   */
  update: async (id: string, status: string): Promise<BluetoothDevice> => {
    const response: any = await apiClient.patch(`/bluetooth/devices/${id}/status`, { status });
    return response.data || response;
  },

  /**
   * Update device battery level
   */
  updateBattery: async (id: string, level: number): Promise<BluetoothDeviceStatus> => {
    const response: any = await apiClient.patch(`/bluetooth/devices/${id}/battery`, { battery_level: level });
    return response.data || response;
  },

  /**
   * Update device signal strength
   */
  updateSignal: async (id: string, strength: number): Promise<BluetoothDeviceStatus> => {
    const response: any = await apiClient.patch(`/bluetooth/devices/${id}/signal`, { signal_strength: strength });
    return response.data || response;
  },
};

// ============================================================================
// Battery API
// ============================================================================

export const bluetoothBatteryAPI = {
  /**
   * Get devices with low battery
   */
  getLowBattery: async (threshold: number): Promise<BatteryInfo[]> => {
    const response: any = await apiClient.get('/bluetooth/devices/battery/low', { threshold });
    return response.data || response || [];
  },
};

// ============================================================================
// Proximity API
// ============================================================================

export const bluetoothProximityAPI = {
  /**
   * Get device proximity information
   */
  get: async (id: string): Promise<ProximityInfo> => {
    const response: any = await apiClient.get(`/bluetooth/devices/${id}/proximity`);
    return response.data || response;
  },
};

// ============================================================================
// Unified Export
// ============================================================================

export const bluetoothAPI = {
  devices: bluetoothDevicesAPI,
  status: bluetoothStatusAPI,
  battery: bluetoothBatteryAPI,
  proximity: bluetoothProximityAPI,
};
