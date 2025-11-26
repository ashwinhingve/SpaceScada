/**
 * ChirpStack API Client Service
 * Provides integration with ChirpStack LoRaWAN Network Server
 *
 * Based on ChirpStack API v4 gRPC-Gateway REST API
 * Documentation: https://www.chirpstack.io/docs/chirpstack/api/grpc-gateway.html
 */

import axios, { AxiosInstance } from 'axios';

// Environment configuration
const CHIRPSTACK_API_URL = process.env.CHIRPSTACK_API_URL || 'http://localhost:8080';
const CHIRPSTACK_API_KEY = process.env.CHIRPSTACK_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';

// Types
export interface ChirpStackApplication {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
}

export interface ChirpStackGateway {
  gatewayId: string;
  name: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  tenantId?: string;
  statsInterval?: number;
  metadata?: Record<string, string>;
}

export interface ChirpStackDevice {
  devEui: string;
  name: string;
  description?: string;
  applicationId: string;
  deviceProfileId: string;
  skipFCntCheck?: boolean;
  isDisabled?: boolean;
  variables?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface ChirpStackDeviceKeys {
  devEui: string;
  nwkKey?: string; // LoRaWAN 1.1
  appKey?: string; // LoRaWAN 1.0
}

export interface ChirpStackDeviceActivation {
  devEui: string;
  devAddr: string;
  appSKey: string;
  nwkSEncKey: string;
  sNwkSIntKey?: string;
  fNwkSIntKey?: string;
  fCntUp: number;
  nFCntDown: number;
  aFCntDown: number;
}

/**
 * ChirpStack API Client
 */
export class ChirpStackService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CHIRPSTACK_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Grpc-Metadata-Authorization': `Bearer ${CHIRPSTACK_API_KEY}`,
      },
      timeout: 10000,
    });
  }

  // =============================================
  // APPLICATIONS
  // =============================================

  /**
   * List applications
   */
  async listApplications(
    limit: number = 100,
    offset: number = 0,
    tenantId?: string
  ): Promise<ChirpStackApplication[]> {
    try {
      const response = await this.client.get('/api/applications', {
        params: { limit, offset, tenantId },
      });
      return response.data.result || [];
    } catch (error) {
      console.error('Failed to list applications:', error);
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string): Promise<ChirpStackApplication> {
    try {
      const response = await this.client.get(`/api/applications/${applicationId}`);
      return response.data.application;
    } catch (error) {
      console.error(`Failed to get application ${applicationId}:`, error);
      throw error;
    }
  }

  /**
   * Create application
   */
  async createApplication(application: Omit<ChirpStackApplication, 'id'>): Promise<string> {
    try {
      const response = await this.client.post('/api/applications', {
        application,
      });
      return response.data.id;
    } catch (error) {
      console.error('Failed to create application:', error);
      throw error;
    }
  }

  /**
   * Update application
   */
  async updateApplication(application: ChirpStackApplication): Promise<void> {
    try {
      await this.client.put(`/api/applications/${application.id}`, {
        application,
      });
    } catch (error) {
      console.error(`Failed to update application ${application.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete application
   */
  async deleteApplication(applicationId: string): Promise<void> {
    try {
      await this.client.delete(`/api/applications/${applicationId}`);
    } catch (error) {
      console.error(`Failed to delete application ${applicationId}:`, error);
      throw error;
    }
  }

  // =============================================
  // GATEWAYS
  // =============================================

  /**
   * List gateways
   */
  async listGateways(
    limit: number = 100,
    offset: number = 0,
    tenantId?: string
  ): Promise<ChirpStackGateway[]> {
    try {
      const response = await this.client.get('/api/gateways', {
        params: { limit, offset, tenantId },
      });
      return response.data.result || [];
    } catch (error) {
      console.error('Failed to list gateways:', error);
      throw error;
    }
  }

  /**
   * Get gateway by ID
   */
  async getGateway(gatewayId: string): Promise<ChirpStackGateway> {
    try {
      const response = await this.client.get(`/api/gateways/${gatewayId}`);
      return response.data.gateway;
    } catch (error) {
      console.error(`Failed to get gateway ${gatewayId}:`, error);
      throw error;
    }
  }

  /**
   * Create gateway
   */
  async createGateway(gateway: ChirpStackGateway): Promise<void> {
    try {
      await this.client.post('/api/gateways', {
        gateway,
      });
    } catch (error) {
      console.error('Failed to create gateway:', error);
      throw error;
    }
  }

  /**
   * Update gateway
   */
  async updateGateway(gateway: ChirpStackGateway): Promise<void> {
    try {
      await this.client.put(`/api/gateways/${gateway.gatewayId}`, {
        gateway,
      });
    } catch (error) {
      console.error(`Failed to update gateway ${gateway.gatewayId}:`, error);
      throw error;
    }
  }

  /**
   * Delete gateway
   */
  async deleteGateway(gatewayId: string): Promise<void> {
    try {
      await this.client.delete(`/api/gateways/${gatewayId}`);
    } catch (error) {
      console.error(`Failed to delete gateway ${gatewayId}:`, error);
      throw error;
    }
  }

  /**
   * Get gateway stats
   */
  async getGatewayStats(
    gatewayId: string,
    start: Date,
    end: Date
  ): Promise<any> {
    try {
      const response = await this.client.get(`/api/gateways/${gatewayId}/stats`, {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
      return response.data.result;
    } catch (error) {
      console.error(`Failed to get gateway stats for ${gatewayId}:`, error);
      throw error;
    }
  }

  // =============================================
  // DEVICES
  // =============================================

  /**
   * List devices for an application
   */
  async listDevices(
    applicationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ChirpStackDevice[]> {
    try {
      const response = await this.client.get('/api/devices', {
        params: { applicationId, limit, offset },
      });
      return response.data.result || [];
    } catch (error) {
      console.error(`Failed to list devices for application ${applicationId}:`, error);
      throw error;
    }
  }

  /**
   * Get device by DevEUI
   */
  async getDevice(devEui: string): Promise<ChirpStackDevice> {
    try {
      const response = await this.client.get(`/api/devices/${devEui}`);
      return response.data.device;
    } catch (error) {
      console.error(`Failed to get device ${devEui}:`, error);
      throw error;
    }
  }

  /**
   * Create device
   */
  async createDevice(device: ChirpStackDevice): Promise<void> {
    try {
      await this.client.post('/api/devices', {
        device,
      });
    } catch (error) {
      console.error('Failed to create device:', error);
      throw error;
    }
  }

  /**
   * Update device
   */
  async updateDevice(device: ChirpStackDevice): Promise<void> {
    try {
      await this.client.put(`/api/devices/${device.devEui}`, {
        device,
      });
    } catch (error) {
      console.error(`Failed to update device ${device.devEui}:`, error);
      throw error;
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(devEui: string): Promise<void> {
    try {
      await this.client.delete(`/api/devices/${devEui}`);
    } catch (error) {
      console.error(`Failed to delete device ${devEui}:`, error);
      throw error;
    }
  }

  /**
   * Create device keys (OTAA)
   */
  async createDeviceKeys(keys: ChirpStackDeviceKeys): Promise<void> {
    try {
      await this.client.post(`/api/devices/${keys.devEui}/keys`, {
        deviceKeys: keys,
      });
    } catch (error) {
      console.error(`Failed to create device keys for ${keys.devEui}:`, error);
      throw error;
    }
  }

  /**
   * Activate device (ABP)
   */
  async activateDevice(activation: ChirpStackDeviceActivation): Promise<void> {
    try {
      await this.client.post(`/api/devices/${activation.devEui}/activate`, {
        deviceActivation: activation,
      });
    } catch (error) {
      console.error(`Failed to activate device ${activation.devEui}:`, error);
      throw error;
    }
  }

  /**
   * Get device activation
   */
  async getDeviceActivation(devEui: string): Promise<ChirpStackDeviceActivation> {
    try {
      const response = await this.client.get(`/api/devices/${devEui}/activation`);
      return response.data.deviceActivation;
    } catch (error) {
      console.error(`Failed to get device activation for ${devEui}:`, error);
      throw error;
    }
  }

  /**
   * Send downlink to device
   */
  async sendDownlink(devEui: string, data: string, fPort: number, confirmed: boolean = false): Promise<void> {
    try {
      await this.client.post(`/api/devices/${devEui}/queue`, {
        queueItem: {
          confirmed,
          fPort,
          data: Buffer.from(data, 'hex').toString('base64'),
        },
      });
    } catch (error) {
      console.error(`Failed to send downlink to device ${devEui}:`, error);
      throw error;
    }
  }

  // =============================================
  // METRICS & MONITORING
  // =============================================

  /**
   * Get device metrics
   */
  async getDeviceMetrics(devEui: string, start: Date, end: Date, aggregation: string = 'DAY'): Promise<any> {
    try {
      const response = await this.client.get(`/api/devices/${devEui}/metrics`, {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
          aggregation,
        },
      });
      return response.data.metrics;
    } catch (error) {
      console.error(`Failed to get device metrics for ${devEui}:`, error);
      throw error;
    }
  }

  /**
   * Get device link metrics (RSSI, SNR, etc.)
   */
  async getDeviceLinkMetrics(devEui: string, start: Date, end: Date): Promise<any> {
    try {
      const response = await this.client.get(`/api/devices/${devEui}/link-metrics`, {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
      return response.data.result;
    } catch (error) {
      console.error(`Failed to get device link metrics for ${devEui}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const chirpstackService = new ChirpStackService();
