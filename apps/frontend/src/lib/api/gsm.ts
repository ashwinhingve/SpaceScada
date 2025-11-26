/**
 * GSM Device API Module
 * Handles all GSM/ESP32 device operations including SMS, GPS, network status, and commands
 */

import { apiClient } from './client';
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

// Types
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

// Devices
export async function getDevices(): Promise<GSMDevice[]> {
  return apiClient.get<GSMDevice[]>('/gsm/devices');
}

export async function getDevice(id: string): Promise<GSMDevice> {
  return apiClient.get<GSMDevice>(`/gsm/devices/${id}`);
}

export async function createDevice(
  data: Partial<GSMDevice>
): Promise<GSMDevice> {
  return apiClient.post<GSMDevice>('/gsm/devices', data);
}

export async function deleteDevice(id: string): Promise<void> {
  return apiClient.delete<void>(`/gsm/devices/${id}`);
}

// SMS Operations
export async function sendSMS(
  id: string,
  data: SendSMSRequest
): Promise<SendSMSResponse> {
  return apiClient.post<SendSMSResponse>(
    `/gsm/devices/${id}/sms/send`,
    data
  );
}

export async function getSMS(
  id: string,
  filters?: SMSFilter
): Promise<SMSMessage[]> {
  return apiClient.get<SMSMessage[]>(
    `/gsm/devices/${id}/sms`,
    filters
  );
}

export async function syncSMS(id: string): Promise<{ count: number }> {
  return apiClient.post<{ count: number }>(
    `/gsm/devices/${id}/sms/sync`,
    {}
  );
}

// GPS Operations
export async function getGPS(id: string): Promise<GPSLocation> {
  return apiClient.get<GPSLocation>(`/gsm/devices/${id}/gps`);
}

export interface GPSHistoryParams {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export async function getGPSHistory(
  id: string,
  params?: GPSHistoryParams
): Promise<GPSLocation[]> {
  return apiClient.get<GPSLocation[]>(
    `/gsm/devices/${id}/gps/history`,
    params
  );
}

// Network Status
export async function getNetworkStatus(
  id: string
): Promise<GSMNetworkStatus> {
  return apiClient.get<GSMNetworkStatus>(
    `/gsm/devices/${id}/network/status`
  );
}

export async function getNetworkHistory(
  id: string,
  params?: GPSHistoryParams
): Promise<NetworkStatusHistory[]> {
  return apiClient.get<NetworkStatusHistory[]>(
    `/gsm/devices/${id}/network/history`,
    params
  );
}

// Commands
export async function sendCommand(
  id: string,
  command: GSMCommand
): Promise<CommandHistory> {
  return apiClient.post<CommandHistory>(
    `/gsm/devices/${id}/commands`,
    command
  );
}

export async function getCommandHistory(
  id: string,
  params?: GPSHistoryParams
): Promise<CommandHistory[]> {
  return apiClient.get<CommandHistory[]>(
    `/gsm/devices/${id}/commands/history`,
    params
  );
}
