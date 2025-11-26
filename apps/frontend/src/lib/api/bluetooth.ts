/**
 * Bluetooth Device API Module
 * Handles all Bluetooth device operations including BLE and classic Bluetooth management
 */

import { apiClient } from './client';
import type {
  BluetoothDevice,
  BluetoothDeviceConfig,
  BluetoothDeviceStatus,
  BluetoothProtocol,
} from '@webscada/shared-types';

// Types
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

// Devices
export async function getDevices(
  params?: BluetoothDeviceParams
): Promise<BluetoothDevice[]> {
  return apiClient.get<BluetoothDevice[]>(
    '/bluetooth/devices',
    params
  );
}

export async function getDevice(id: string): Promise<BluetoothDevice> {
  return apiClient.get<BluetoothDevice>(`/bluetooth/devices/${id}`);
}

export async function createDevice(
  data: Partial<BluetoothDevice>
): Promise<BluetoothDevice> {
  return apiClient.post<BluetoothDevice>(
    '/bluetooth/devices',
    data
  );
}

export async function updateDevice(
  id: string,
  data: Partial<BluetoothDevice>
): Promise<BluetoothDevice> {
  return apiClient.put<BluetoothDevice>(
    `/bluetooth/devices/${id}`,
    data
  );
}

export async function deleteDevice(id: string): Promise<void> {
  return apiClient.delete<void>(`/bluetooth/devices/${id}`);
}

// Status Operations
export async function updateStatus(
  id: string,
  status: string
): Promise<BluetoothDevice> {
  return apiClient.patch<BluetoothDevice>(
    `/bluetooth/devices/${id}/status`,
    { status }
  );
}

export async function updateBattery(
  id: string,
  level: number
): Promise<BluetoothDeviceStatus> {
  return apiClient.patch<BluetoothDeviceStatus>(
    `/bluetooth/devices/${id}/battery`,
    { battery_level: level }
  );
}

export async function updateSignal(
  id: string,
  strength: number
): Promise<BluetoothDeviceStatus> {
  return apiClient.patch<BluetoothDeviceStatus>(
    `/bluetooth/devices/${id}/signal`,
    { signal_strength: strength }
  );
}

// Filtering Operations
export async function getDevicesByStatus(
  status: string
): Promise<BluetoothDevice[]> {
  return apiClient.get<BluetoothDevice[]>(
    '/bluetooth/devices',
    { status }
  );
}

export async function getDevicesByProtocol(
  protocol: BluetoothProtocol
): Promise<BluetoothDevice[]> {
  return apiClient.get<BluetoothDevice[]>(
    '/bluetooth/devices',
    { protocol }
  );
}

export async function getLowBatteryDevices(
  threshold: number
): Promise<BatteryInfo[]> {
  return apiClient.get<BatteryInfo[]>(
    '/bluetooth/devices/battery/low',
    { threshold }
  );
}

// Proximity & Distance
export async function getProximity(id: string): Promise<ProximityInfo> {
  return apiClient.get<ProximityInfo>(
    `/bluetooth/devices/${id}/proximity`
  );
}
