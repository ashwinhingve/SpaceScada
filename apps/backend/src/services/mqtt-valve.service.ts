/**
 * MQTT Valve Control Service
 * Handles MQTT communication for valve control and monitoring
 */

import mqtt from 'mqtt';
import type { Server as SocketIOServer } from 'socket.io';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'MQTTValveService' });

interface ValveCommand {
  valve_number: number;
  state: boolean;
  timestamp: number;
}

interface ValveStatus {
  number: number;
  status: boolean;
}

interface TelemetryData {
  value: number;
  timestamp?: Date;
}

class MQTTValveService {
  private client: mqtt.MqttClient | null = null;
  private io: SocketIOServer | null = null;
  private deviceId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    this.deviceId = process.env.DEFAULT_DEVICE_ID || 'FIELD_DEVICE_01';
  }

  initialize(io: SocketIOServer, brokerUrl: string, options?: mqtt.IClientOptions): void {
    this.io = io;

    const defaultOptions: mqtt.IClientOptions = {
      username: process.env.MQTT_USERNAME || 'webscada',
      password: process.env.MQTT_PASSWORD,
      clientId: `backend_valve_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 5000,
      ...options,
    };

    this.client = mqtt.connect(brokerUrl, defaultOptions);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Connected to MQTT Broker for valve control');
      this.reconnectAttempts = 0;
      this.subscribeToTopics();
    });

    this.client.on('message', async (topic: string, message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        await this.handleMessage(topic, data);
      } catch (error) {
        logger.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (error) => {
      logger.error('MQTT Error:', error);
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        logger.info(
          `Reconnecting to MQTT Broker (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
      }
    });

    this.client.on('close', () => {
      logger.warn('MQTT connection closed');
    });
  }

  private subscribeToTopics(): void {
    if (!this.client) return;

    const topics = [
      `scada/devices/${this.deviceId}/telemetry/pressure`,
      `scada/devices/${this.deviceId}/telemetry/flow`,
      `scada/devices/${this.deviceId}/telemetry/valve_status`,
      `scada/devices/${this.deviceId}/telemetry/valve_runtime`,
      `scada/devices/${this.deviceId}/status`,
    ];

    topics.forEach((topic) => {
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          logger.info(`Subscribed to ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, data: any): Promise<void> {
    if (topic.includes('/telemetry/pressure')) {
      this.handlePressureData(data);
    } else if (topic.includes('/telemetry/flow')) {
      this.handleFlowData(data);
    } else if (topic.includes('/telemetry/valve_status')) {
      this.handleValveStatus(data);
    } else if (topic.includes('/telemetry/valve_runtime')) {
      this.handleValveRuntime(data);
    } else if (topic.includes('/status')) {
      this.handleDeviceStatus(data);
    }
  }

  private handlePressureData(data: TelemetryData): void {
    if (this.io) {
      this.io.emit('pressure_update', {
        value: data.value,
        unit: 'kg/cm²',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleFlowData(data: TelemetryData): void {
    if (this.io) {
      this.io.emit('flow_update', {
        value: data.value,
        unit: 'LPS',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleValveStatus(data: { valves: ValveStatus[] }): void {
    if (this.io) {
      this.io.emit('valve_status_update', {
        valves: data.valves,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleValveRuntime(data: { valve_number: number; duration_seconds: number }): void {
    if (this.io) {
      this.io.emit('valve_runtime_update', {
        valve_number: data.valve_number,
        duration_seconds: data.duration_seconds,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleDeviceStatus(data: any): void {
    if (this.io) {
      this.io.emit('device_status_update', {
        device_id: this.deviceId,
        status: 'online',
        timestamp: new Date().toISOString(),
        ...data,
      });
    }
  }

  async publishValveCommand(valveNumber: number, state: boolean, username: string): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT client not connected');
    }

    const command: ValveCommand = {
      valve_number: valveNumber,
      state,
      timestamp: Date.now(),
    };

    const topic = `scada/devices/${this.deviceId}/command/valve_control`;

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, JSON.stringify(command), { qos: 1 }, (error) => {
        if (error) {
          logger.error('Failed to publish valve command:', error);
          reject(error);
        } else {
          logger.info('Valve command published:', command);

          // Emit to connected clients
          if (this.io) {
            this.io.emit('command_executed', {
              username,
              valve_number: valveNumber,
              state,
              timestamp: new Date().toISOString(),
            });
          }

          resolve();
        }
      });
    });
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      logger.info('MQTT client disconnected');
    }
  }
}

export const mqttValveService = new MQTTValveService();
export default mqttValveService;
