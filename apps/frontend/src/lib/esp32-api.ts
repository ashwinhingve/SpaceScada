import {
  ESP32Device,
  ESP32SensorData,
  ESP32ControlCommand,
  ESP32SensorType,
  ApiResponse,
} from '@webscada/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RegisterDeviceRequest {
  name: string;
  sensorType: ESP32SensorType;
  mqttBroker?: string;
  mqttPort?: number;
  mqttUsername?: string;
  mqttPassword?: string;
  wifiSSID?: string;
  publishInterval?: number;
  heartbeatInterval?: number;
  gpioConfig?: {
    dataPin?: number;
    ledPin?: number;
    relayPins?: number[];
    inputPins?: number[];
    outputPins?: number[];
  };
}

export interface UpdateDeviceRequest extends Partial<RegisterDeviceRequest> {}

export interface SensorDataHistoryParams {
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}

export interface SensorDataHistoryResponse {
  deviceId: string;
  history: ESP32SensorData[];
  count: number;
  startTime: Date;
  endTime: Date;
}

class ESP32API {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = `${baseUrl}/api/esp32`;
  }

  /**
   * List all ESP32 devices
   */
  async listDevices(): Promise<ESP32Device[]> {
    const response = await fetch(`${this.baseUrl}/devices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list devices: ${response.statusText}`);
    }

    const result: ApiResponse<ESP32Device[]> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to list devices');
    }

    return result.data;
  }

  /**
   * Get a specific ESP32 device by ID
   */
  async getDevice(deviceId: string): Promise<ESP32Device> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get device: ${response.statusText}`);
    }

    const result: ApiResponse<ESP32Device> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get device');
    }

    return result.data;
  }

  /**
   * Register a new ESP32 device
   */
  async registerDevice(request: RegisterDeviceRequest): Promise<ESP32Device> {
    const response = await fetch(`${this.baseUrl}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to register device: ${response.statusText}`);
    }

    const result: ApiResponse<ESP32Device> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to register device');
    }

    return result.data;
  }

  /**
   * Update an ESP32 device configuration
   */
  async updateDevice(deviceId: string, request: UpdateDeviceRequest): Promise<ESP32Device> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to update device: ${response.statusText}`);
    }

    const result: ApiResponse<ESP32Device> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to update device');
    }

    return result.data;
  }

  /**
   * Delete an ESP32 device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete device: ${response.statusText}`);
    }

    const result: ApiResponse<{ deviceId: string }> = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to delete device');
    }
  }

  /**
   * Get latest sensor data for a device
   */
  async getDeviceSensorData(deviceId: string): Promise<ESP32SensorData> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/sensor-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get sensor data: ${response.statusText}`);
    }

    const result: ApiResponse<ESP32SensorData> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get sensor data');
    }

    return result.data;
  }

  /**
   * Get sensor data history for a device
   */
  async getDeviceSensorHistory(
    deviceId: string,
    params?: SensorDataHistoryParams
  ): Promise<SensorDataHistoryResponse> {
    const queryParams = new URLSearchParams();

    if (params?.startTime) {
      queryParams.append('startTime', params.startTime.toISOString());
    }
    if (params?.endTime) {
      queryParams.append('endTime', params.endTime.toISOString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = `${this.baseUrl}/devices/${deviceId}/sensor-data/history${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get sensor history: ${response.statusText}`);
    }

    const result: ApiResponse<SensorDataHistoryResponse> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get sensor history');
    }

    return result.data;
  }

  /**
   * Send control command to a device
   */
  async sendControlCommand(deviceId: string, command: ESP32ControlCommand): Promise<void> {
    const response = await fetch(`${this.baseUrl}/devices/${deviceId}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send control command: ${response.statusText}`);
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to send control command');
    }
  }
}

// Export singleton instance
export const esp32API = new ESP32API();

// Export class for custom instances
export default ESP32API;
