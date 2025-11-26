/**
 * Telemetry API Endpoints
 * Handles device telemetry data operations including querying, recording, and statistics
 */

import { apiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface TelemetryDataPoint {
  id: string;
  device_id: string;
  device_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  metadata: Record<string, any> | null;
  timestamp: string;
  created_at: string;
}

export interface TelemetryQuery {
  metric_name?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  aggregation?: 'hourly' | 'daily';
}

export interface RecordTelemetryRequest {
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export type DeviceType = 'wifi' | 'bluetooth' | 'gsm' | 'lorawan';

// ============================================================================
// Telemetry API
// ============================================================================

export const telemetryAPI = {
  /**
   * Get telemetry data for a device with optional filters
   */
  getDeviceTelemetry: async (
    deviceType: DeviceType,
    deviceId: string,
    query?: TelemetryQuery
  ): Promise<TelemetryDataPoint[]> => {
    const response: any = await apiClient.get(
      `/api/${deviceType}/${deviceId}/telemetry`,
      query
    );
    return response.data || response || [];
  },

  /**
   * Get latest telemetry values for all metrics
   */
  getLatest: async (
    deviceType: DeviceType,
    deviceId: string
  ): Promise<Record<string, TelemetryDataPoint>> => {
    const response: any = await apiClient.get(
      `/api/${deviceType}/${deviceId}/telemetry/latest`
    );
    return response.data || response || {};
  },

  /**
   * Record new telemetry data point
   */
  record: async (
    deviceType: DeviceType,
    deviceId: string,
    telemetry: RecordTelemetryRequest
  ): Promise<TelemetryDataPoint> => {
    const response: any = await apiClient.post(
      `/api/${deviceType}/${deviceId}/telemetry`,
      telemetry
    );
    return response.data || response;
  },

  /**
   * Get telemetry statistics
   */
  getStats: async (
    deviceType: DeviceType,
    deviceId: string,
    metricName?: string
  ): Promise<any[]> => {
    const params = metricName ? { metric_name: metricName } : undefined;
    const response: any = await apiClient.get(
      `/api/${deviceType}/${deviceId}/telemetry/stats`,
      params
    );
    return response.data || response || [];
  },
};
