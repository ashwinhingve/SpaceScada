/**
 * LoRaWAN Device API Module
 * Handles all LoRaWAN device operations including applications, devices, gateways, and downlinks
 */

import { apiClient } from './client';
import type {
  LoRaWANDevice,
  LoRaWANDeviceConfig,
  LoRaWANDeviceStatus,
} from '@webscada/shared-types';

// Types
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

// Applications
export async function getApplications(): Promise<LoRaWANApplication[]> {
  const response: any = await apiClient.get('/api/lorawan/applications');
  return response.data || response || [];
}

export async function getApplication(
  id: string
): Promise<LoRaWANApplication> {
  const response: any = await apiClient.get(
    `/api/lorawan/applications/${id}`
  );
  return response.data || response;
}

export async function createApplication(
  data: Partial<LoRaWANApplication>
): Promise<LoRaWANApplication> {
  const response: any = await apiClient.post(
    '/api/lorawan/applications',
    data
  );
  return response.data || response;
}

export async function updateApplication(
  id: string,
  data: Partial<LoRaWANApplication>
): Promise<LoRaWANApplication> {
  const response: any = await apiClient.put(
    `/api/lorawan/applications/${id}`,
    data
  );
  return response.data || response;
}

export async function deleteApplication(id: string): Promise<void> {
  await apiClient.delete(`/api/lorawan/applications/${id}`);
}

// Devices
export interface GetDevicesParams {
  applicationId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getDevices(
  applicationId?: string,
  params?: Omit<GetDevicesParams, 'applicationId'>
): Promise<LoRaWANDevice[]> {
  if (applicationId) {
    // Get devices for a specific application
    const response: any = await apiClient.get(
      `/api/lorawan/applications/${applicationId}/devices`,
      params
    );
    return response.data || response || [];
  }
  // This endpoint may not exist in the backend yet
  return [];
}

export async function getDevice(devEui: string): Promise<LoRaWANDevice> {
  const response: any = await apiClient.get(
    `/api/lorawan/devices/${devEui}`
  );
  return response.data || response;
}

export async function createDevice(
  data: Partial<LoRaWANDevice>
): Promise<LoRaWANDevice> {
  const response: any = await apiClient.post('/api/lorawan/devices', data);
  return response.data || response;
}

export async function updateDevice(
  devEui: string,
  data: Partial<LoRaWANDevice>
): Promise<LoRaWANDevice> {
  const response: any = await apiClient.put(
    `/api/lorawan/devices/${devEui}`,
    data
  );
  return response.data || response;
}

export async function deleteDevice(devEui: string): Promise<void> {
  await apiClient.delete(`/api/lorawan/devices/${devEui}`);
}

// Gateways
export async function getGateways(): Promise<LoRaWANGateway[]> {
  const response: any = await apiClient.get('/api/lorawan/gateways');
  return response.data || response || [];
}

export async function getGateway(id: string): Promise<LoRaWANGateway> {
  const response: any = await apiClient.get(`/api/lorawan/gateways/${id}`);
  return response.data || response;
}

export async function createGateway(
  data: Partial<LoRaWANGateway>
): Promise<LoRaWANGateway> {
  const response: any = await apiClient.post('/api/lorawan/gateways', data);
  return response.data || response;
}

export async function updateGateway(
  id: string,
  data: Partial<LoRaWANGateway>
): Promise<LoRaWANGateway> {
  const response: any = await apiClient.put(
    `/api/lorawan/gateways/${id}`,
    data
  );
  return response.data || response;
}

export async function deleteGateway(id: string): Promise<void> {
  await apiClient.delete(`/api/lorawan/gateways/${id}`);
}

// Downlinks & Metrics
export async function sendDownlink(
  devEui: string,
  data: DeviceDownlink
): Promise<{ id: string; status: string }> {
  const response: any = await apiClient.post(
    `/api/lorawan/devices/${devEui}/downlink`,
    data
  );
  return response.data || response;
}

export async function getDeviceMetrics(
  devEui: string
): Promise<DeviceMetrics> {
  const response: any = await apiClient.get(
    `/api/lorawan/devices/${devEui}/metrics`
  );
  return response.data || response;
}
