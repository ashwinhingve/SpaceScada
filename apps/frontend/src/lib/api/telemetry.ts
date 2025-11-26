/**
 * Telemetry API Client
 * Functions for fetching and recording device telemetry data
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

/**
 * Get telemetry data for a device
 */
export async function getDeviceTelemetry(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string,
  query?: TelemetryQuery
): Promise<TelemetryDataPoint[]> {
  const params = new URLSearchParams();
  if (query?.metric_name) params.append('metric_name', query.metric_name);
  if (query?.start_time) params.append('start_time', query.start_time);
  if (query?.end_time) params.append('end_time', query.end_time);
  if (query?.limit) params.append('limit', query.limit.toString());
  if (query?.aggregation) params.append('aggregation', query.aggregation);

  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/telemetry?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch telemetry data');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get latest telemetry values for all metrics
 */
export async function getLatestTelemetry(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string
): Promise<Record<string, TelemetryDataPoint>> {
  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/telemetry/latest`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch latest telemetry');
  }

  const data = await response.json();
  return data.data || {};
}

/**
 * Record telemetry data point
 */
export async function recordTelemetry(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string,
  telemetry: {
    metric_name: string;
    metric_value: number;
    metric_unit?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  }
): Promise<TelemetryDataPoint> {
  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/telemetry`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telemetry),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to record telemetry');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get telemetry statistics
 */
export async function getTelemetryStats(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string,
  metricName?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  if (metricName) params.append('metric_name', metricName);

  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/telemetry/stats?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch telemetry statistics');
  }

  const data = await response.json();
  return data.data || [];
}
