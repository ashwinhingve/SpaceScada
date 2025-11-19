/**
 * GSM API Client for WebSCADA Application
 * Provides methods for interacting with GSM devices
 */

import type {
  GSMDevice,
  SendSMSRequest,
  SendSMSResponse,
  SMSMessage,
  GPSLocation,
  GSMNetworkStatus,
  GSMCommand,
  SMSDirection,
  SMSStatus,
  ApiResponse,
} from '@webscada/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class GSMApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || { code: 'UNKNOWN', message: response.statusText },
          timestamp: new Date(data.timestamp),
        };
      }

      return {
        success: true,
        data: data.data,
        timestamp: new Date(data.timestamp),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        timestamp: new Date(),
      };
    }
  }

  // ===== GSM Device Management =====

  /**
   * List all GSM devices
   */
  async listDevices(): Promise<ApiResponse<GSMDevice[]>> {
    return this.request<GSMDevice[]>('/api/gsm');
  }

  /**
   * Get GSM device by ID
   */
  async getDevice(deviceId: string): Promise<ApiResponse<GSMDevice>> {
    return this.request<GSMDevice>(`/api/gsm/${deviceId}`);
  }

  /**
   * Register a new GSM device
   */
  async registerDevice(device: GSMDevice): Promise<ApiResponse<GSMDevice>> {
    return this.request<GSMDevice>('/api/gsm', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  /**
   * Unregister a GSM device
   */
  async unregisterDevice(deviceId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/gsm/${deviceId}`, {
      method: 'DELETE',
    });
  }

  // ===== SMS Operations =====

  /**
   * Send SMS message
   */
  async sendSMS(deviceId: string, request: SendSMSRequest): Promise<ApiResponse<SendSMSResponse>> {
    return this.request<SendSMSResponse>(`/api/gsm/${deviceId}/sms/send`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get SMS messages
   */
  async getSMSMessages(
    deviceId: string,
    filter?: {
      direction?: SMSDirection;
      status?: SMSStatus;
      limit?: number;
    }
  ): Promise<ApiResponse<SMSMessage[]>> {
    const params = new URLSearchParams();
    if (filter?.direction) params.append('direction', filter.direction);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const query = params.toString();
    const url = `/api/gsm/${deviceId}/sms${query ? `?${query}` : ''}`;

    return this.request<SMSMessage[]>(url);
  }

  /**
   * Sync SMS messages from device
   */
  async syncSMS(deviceId: string): Promise<ApiResponse<SMSMessage[]>> {
    return this.request<SMSMessage[]>(`/api/gsm/${deviceId}/sms/sync`, {
      method: 'POST',
    });
  }

  // ===== GPS Operations =====

  /**
   * Get current GPS location
   */
  async getGPSLocation(deviceId: string): Promise<ApiResponse<GPSLocation>> {
    return this.request<GPSLocation>(`/api/gsm/${deviceId}/gps`);
  }

  /**
   * Get GPS location history
   */
  async getLocationHistory(
    deviceId: string,
    limit: number = 100
  ): Promise<ApiResponse<GPSLocation[]>> {
    return this.request<GPSLocation[]>(`/api/gsm/${deviceId}/gps/history?limit=${limit}`);
  }

  // ===== Network Operations =====

  /**
   * Get network status
   */
  async getNetworkStatus(deviceId: string): Promise<ApiResponse<GSMNetworkStatus>> {
    return this.request<GSMNetworkStatus>(`/api/gsm/${deviceId}/network`);
  }

  /**
   * Get network status history
   */
  async getNetworkStatusHistory(
    deviceId: string,
    limit: number = 100
  ): Promise<ApiResponse<GSMNetworkStatus[]>> {
    return this.request<GSMNetworkStatus[]>(`/api/gsm/${deviceId}/network/history?limit=${limit}`);
  }

  // ===== Command Operations =====

  /**
   * Send AT command
   */
  async sendCommand(
    deviceId: string,
    command: string,
    data?: string
  ): Promise<ApiResponse<GSMCommand>> {
    return this.request<GSMCommand>(`/api/gsm/${deviceId}/commands`, {
      method: 'POST',
      body: JSON.stringify({ command, data }),
    });
  }

  /**
   * Get command history
   */
  async getCommandHistory(
    deviceId: string,
    limit: number = 50
  ): Promise<ApiResponse<GSMCommand[]>> {
    return this.request<GSMCommand[]>(`/api/gsm/${deviceId}/commands?limit=${limit}`);
  }
}

export const gsmApiClient = new GSMApiClient(API_URL);
