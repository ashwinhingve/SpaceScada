import { ConnectionConfig, Tag, TagValue } from '@webscada/shared-types';
import { createLogger } from '@webscada/utils';

import { BaseProtocolAdapter } from './base';

const logger = createLogger({ prefix: 'MQTT' });

export class MQTTAdapter extends BaseProtocolAdapter {
  private subscriptions: Map<string, (value: TagValue) => void> = new Map();

  async connect(config: ConnectionConfig): Promise<void> {
    logger.info(`Connecting to MQTT broker at ${config.host}:${config.port}`);
    this.config = config;

    // TODO: Implement actual MQTT connection
    // This would use a library like 'mqtt'
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.connected = true;
    logger.info('Connected successfully');
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    logger.info('Disconnecting from MQTT broker');

    // Cleanup subscriptions
    this.subscriptions.clear();

    // TODO: Implement actual disconnection
    this.connected = false;
    logger.info('Disconnected successfully');
  }

  async read(address: string): Promise<TagValue> {
    // MQTT is publish/subscribe, so read operations require a subscription
    throw new Error('Direct read not supported for MQTT. Use subscribe instead.');
  }

  async write(address: string, value: TagValue): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to broker');
    }

    logger.debug(`Publishing value ${value} to topic: ${address}`);

    // TODO: Implement actual MQTT publish
  }

  subscribe(tags: Tag[], callback: (tag: Tag) => void): void {
    if (!this.connected) {
      throw new Error('Not connected to broker');
    }

    logger.info(`Subscribing to ${tags.length} topics`);

    // TODO: Implement actual MQTT subscription
    tags.forEach((tag) => {
      const handler = (value: TagValue) => {
        callback({ ...tag, value, timestamp: new Date() });
      };
      this.subscriptions.set(tag.id, handler);

      // Subscribe to topic (tag.address)
    });
  }

  unsubscribe(tagIds: string[]): void {
    logger.info(`Unsubscribing from ${tagIds.length} topics`);

    tagIds.forEach((tagId) => {
      this.subscriptions.delete(tagId);
      // TODO: Unsubscribe from MQTT topic
    });
  }
}
