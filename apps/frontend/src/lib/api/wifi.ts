/**
 * Wi-Fi Device API Module
 * Handles all Wi-Fi device operations including configuration, status, and signal monitoring
 */

import { apiClient } from './client';
import type {
  WiFiDevice,
  WiFiDeviceConfig,
  WiFiDeviceStatus,
} from '@webscada/shared-types';

// Types
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

// Devices
export async function getDevices(
  params?: WiFiDeviceParams
): Promise<WiFiDevice[]> {
  return apiClient.get<WiFiDevice[]>('/wifi/devices', params);
}

export async function getDevice(id: string): Promise<WiFiDevice> {
  return apiClient.get<WiFiDevice>(`/wifi/devices/${id}`);
}

export async function createDevice(
  data: Partial<WiFiDevice>
): Promise<WiFiDevice> {
  return apiClient.post<WiFiDevice>('/wifi/devices', data);
}

export async function updateDevice(
  id: string,
  data: Partial<WiFiDevice>
): Promise<WiFiDevice> {
  return apiClient.put<WiFiDevice>(`/wifi/devices/${id}`, data);
}

export async function deleteDevice(id: string): Promise<void> {
  return apiClient.delete<void>(`/wifi/devices/${id}`);
}

// Status Operations
export async function updateStatus(
  id: string,
  status: string
): Promise<WiFiDevice> {
  return apiClient.patch<WiFiDevice>(`/wifi/devices/${id}/status`, {
    status,
  });
}

export async function updateSignal(
  id: string,
  strength: number
): Promise<WiFiDeviceStatus> {
  return apiClient.patch<WiFiDeviceStatus>(
    `/wifi/devices/${id}/signal`,
    { signal_strength: strength }
  );
}

// Filtering Operations
export async function getDevicesByStatus(
  status: string
): Promise<WiFiDevice[]> {
  return apiClient.get<WiFiDevice[]>('/wifi/devices', { status });
}

export async function getWeakSignalDevices(
  threshold: number
): Promise<SignalDeviceInfo[]> {
  return apiClient.get<SignalDeviceInfo[]>(
    '/wifi/devices/signal/weak',
    { threshold }
  );
}

// Statistics
export async function getDeviceStats(id: string): Promise<DeviceStats> {
  return apiClient.get<DeviceStats>(`/wifi/devices/${id}/stats`);
}
