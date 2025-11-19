import mqtt from 'mqtt';
import { ConnectionConfig, Tag, TagValue } from '@webscada/shared-types';
import { createLogger } from '@webscada/utils';

import { BaseProtocolAdapter } from './base';

const logger = createLogger({ prefix: 'MQTT' });

export interface MQTTConnectionConfig extends ConnectionConfig {
  options?: {
    username?: string;
    password?: string;
    clientId?: string;
    clean?: boolean;
    keepalive?: number;
    reconnectPeriod?: number;
    connectTimeout?: number;
    qos?: 0 | 1 | 2;
    protocolVersion?: 3 | 4 | 5;
  };
}

export class MQTTAdapter extends BaseProtocolAdapter {
  private client: mqtt.MqttClient | null = null;
  private subscriptions: Map<string, { tag: Tag; callback: (tag: Tag) => void }> = new Map();
  private topicToTagMap: Map<string, string> = new Map();

  async connect(config: ConnectionConfig): Promise<void> {
    logger.info(`Connecting to MQTT broker at ${config.host}:${config.port}`);
    this.config = config;

    const mqttConfig = config as MQTTConnectionConfig;
    const brokerUrl = `mqtt://${config.host}:${config.port}`;

    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(brokerUrl, {
        clientId:
          mqttConfig.options?.clientId || `webscada_${Math.random().toString(16).slice(2, 8)}`,
        username: mqttConfig.options?.username,
        password: mqttConfig.options?.password,
        clean: mqttConfig.options?.clean ?? true,
        keepalive: mqttConfig.options?.keepalive ?? 60,
        reconnectPeriod: mqttConfig.options?.reconnectPeriod ?? 5000,
        connectTimeout: mqttConfig.options?.connectTimeout ?? config.timeout ?? 30000,
        protocolVersion: mqttConfig.options?.protocolVersion ?? 4,
      });

      this.client.on('connect', () => {
        this.connected = true;
        logger.info('Connected successfully to MQTT broker');
        resolve();
      });

      this.client.on('error', (error) => {
        logger.error('MQTT connection error:', error);
        if (!this.connected) {
          reject(error);
        }
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('reconnect', () => {
        logger.info('Reconnecting to MQTT broker...');
      });

      this.client.on('close', () => {
        logger.warn('MQTT connection closed');
        this.connected = false;
      });

      this.client.on('offline', () => {
        logger.warn('MQTT client offline');
        this.connected = false;
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.client) return;

    logger.info('Disconnecting from MQTT broker');

    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(true, {}, () => {
          this.subscriptions.clear();
          this.topicToTagMap.clear();
          this.connected = false;
          this.client = null;
          logger.info('Disconnected successfully');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async read(address: string): Promise<TagValue> {
    // MQTT is publish/subscribe, so direct read operations are not supported
    throw new Error('Direct read not supported for MQTT. Use subscribe instead.');
  }

  async write(address: string, value: TagValue): Promise<void> {
    if (!this.connected || !this.client) {
      throw new Error('Not connected to broker');
    }

    logger.debug(`Publishing value ${value} to topic: ${address}`);

    const mqttConfig = this.config as MQTTConnectionConfig;
    const qos = mqttConfig.options?.qos ?? 0;

    return new Promise((resolve, reject) => {
      const payload = this.formatPayload(value);

      this.client!.publish(address, payload, { qos }, (error) => {
        if (error) {
          logger.error(`Failed to publish to ${address}:`, error);
          reject(error);
        } else {
          logger.debug(`Successfully published to ${address}`);
          resolve();
        }
      });
    });
  }

  subscribe(tags: Tag[], callback: (tag: Tag) => void): void {
    if (!this.connected || !this.client) {
      throw new Error('Not connected to broker');
    }

    logger.info(`Subscribing to ${tags.length} topics`);

    const mqttConfig = this.config as MQTTConnectionConfig;
    const qos = mqttConfig.options?.qos ?? 0;

    tags.forEach((tag) => {
      const topic = tag.address;

      this.subscriptions.set(tag.id, { tag, callback });
      this.topicToTagMap.set(topic, tag.id);

      this.client!.subscribe(topic, { qos }, (error) => {
        if (error) {
          logger.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          logger.debug(`Subscribed to topic: ${topic}`);
        }
      });
    });
  }

  unsubscribe(tagIds: string[]): void {
    if (!this.connected || !this.client) {
      logger.warn('Cannot unsubscribe: not connected');
      return;
    }

    logger.info(`Unsubscribing from ${tagIds.length} topics`);

    tagIds.forEach((tagId) => {
      const subscription = this.subscriptions.get(tagId);
      if (subscription) {
        const topic = subscription.tag.address;

        this.client!.unsubscribe(topic, (error) => {
          if (error) {
            logger.error(`Failed to unsubscribe from ${topic}:`, error);
          } else {
            logger.debug(`Unsubscribed from topic: ${topic}`);
          }
        });

        this.subscriptions.delete(tagId);
        this.topicToTagMap.delete(topic);
      }
    });
  }

  private handleMessage(topic: string, message: Buffer): void {
    const tagId = this.topicToTagMap.get(topic);
    if (!tagId) {
      logger.debug(`Received message on untracked topic: ${topic}`);
      return;
    }

    const subscription = this.subscriptions.get(tagId);
    if (!subscription) {
      logger.debug(`No subscription found for tag: ${tagId}`);
      return;
    }

    try {
      const value = this.parsePayload(message);
      const updatedTag: Tag = {
        ...subscription.tag,
        value,
        timestamp: new Date(),
      };

      subscription.callback(updatedTag);
      logger.debug(`Processed message for tag ${tagId} from topic ${topic}`);
    } catch (error) {
      logger.error(`Failed to process message from ${topic}:`, error);
    }
  }

  private formatPayload(value: TagValue): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private parsePayload(message: Buffer): TagValue {
    const payload = message.toString();

    try {
      // Try to parse as JSON first
      return JSON.parse(payload);
    } catch {
      // If not JSON, try to parse as number
      const num = Number(payload);
      if (!isNaN(num)) {
        return num;
      }

      // Check for boolean
      if (payload.toLowerCase() === 'true') return true;
      if (payload.toLowerCase() === 'false') return false;

      // Return as string
      return payload;
    }
  }

  // ESP32-specific helper methods
  public async publishControl(deviceId: string, command: object): Promise<void> {
    const topic = `devices/${deviceId}/control`;
    const payload = JSON.stringify(command);

    if (!this.connected || !this.client) {
      throw new Error('Not connected to broker');
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          logger.error(`Failed to publish control command to ${deviceId}:`, error);
          reject(error);
        } else {
          logger.info(`Control command sent to ${deviceId}`);
          resolve();
        }
      });
    });
  }

  public subscribeToDevice(deviceId: string, callback: (topic: string, data: any) => void): void {
    if (!this.connected || !this.client) {
      throw new Error('Not connected to broker');
    }

    const topics = [
      `devices/${deviceId}/data`,
      `devices/${deviceId}/status`,
      `devices/${deviceId}/online`,
    ];

    topics.forEach((topic) => {
      this.client!.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          logger.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          logger.info(`Subscribed to device topic: ${topic}`);
        }
      });
    });

    // Store the callback for this device
    const deviceCallbackKey = `device:${deviceId}`;
    this.subscriptions.set(deviceCallbackKey, {
      tag: { id: deviceId, address: `devices/${deviceId}/#` } as Tag,
      callback: (tag) => callback(tag.address, tag.value),
    });
  }

  public unsubscribeFromDevice(deviceId: string): void {
    if (!this.connected || !this.client) {
      logger.warn('Cannot unsubscribe: not connected');
      return;
    }

    const topics = [
      `devices/${deviceId}/data`,
      `devices/${deviceId}/status`,
      `devices/${deviceId}/online`,
    ];

    topics.forEach((topic) => {
      this.client!.unsubscribe(topic, (error) => {
        if (error) {
          logger.error(`Failed to unsubscribe from ${topic}:`, error);
        } else {
          logger.info(`Unsubscribed from device topic: ${topic}`);
        }
      });
    });

    const deviceCallbackKey = `device:${deviceId}`;
    this.subscriptions.delete(deviceCallbackKey);
  }
}
