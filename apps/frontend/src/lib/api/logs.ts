/**
 * Logs API Client
 * Functions for fetching and creating device logs
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface DeviceLog {
  id: string;
  device_id: string;
  device_type: string;
  log_level: LogLevel;
  event_type: string;
  message: string;
  details: Record<string, any> | null;
  timestamp: string;
  created_at: string;
}

export interface LogQuery {
  log_level?: LogLevel;
  event_type?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
}

/**
 * Get device logs
 */
export async function getDeviceLogs(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string,
  query?: LogQuery
): Promise<DeviceLog[]> {
  const params = new URLSearchParams();
  if (query?.log_level) params.append('log_level', query.log_level);
  if (query?.event_type) params.append('event_type', query.event_type);
  if (query?.start_time) params.append('start_time', query.start_time);
  if (query?.end_time) params.append('end_time', query.end_time);
  if (query?.limit) params.append('limit', query.limit.toString());

  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/logs?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch device logs');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get device error logs
 */
export async function getErrorLogs(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string,
  limit?: number
): Promise<DeviceLog[]> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/logs/errors?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch error logs');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get recent device logs (last 24 hours)
 */
export async function getRecentLogs(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string,
  limit?: number
): Promise<DeviceLog[]> {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/logs/recent?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch recent logs');
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Create a device log entry
 */
export async function createLog(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string,
  log: {
    log_level: LogLevel;
    event_type: string;
    message: string;
    details?: Record<string, any>;
    timestamp?: string;
  }
): Promise<DeviceLog> {
  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/logs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create log entry');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get log statistics
 */
export async function getLogStats(
  deviceType: 'wifi' | 'bluetooth' | 'gsm' | 'lorawan',
  deviceId: string
): Promise<any[]> {
  const response = await fetch(
    `${API_URL}/api/${deviceType}/${deviceId}/logs/stats`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch log statistics');
  }

  const data = await response.json();
  return data.data || [];
}
