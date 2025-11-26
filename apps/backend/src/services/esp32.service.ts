import { MQTTAdapter } from '@webscada/protocols';
import {
  ESP32Device,
  ESP32SensorData,
  ESP32ControlState,
  ESP32ControlCommand,
  ESP32Action,
  ESP32HeartbeatPayload,
  DeviceStatus,
} from '@webscada/shared-types';
import { createLogger } from '@webscada/utils';
import { Server as SocketIOServer } from 'socket.io';

import { DatabaseService } from './database';

const logger = createLogger({ prefix: 'ESP32Service' });

/**
 * ESP32 Service
 * Manages ESP32 device operations, MQTT communication, sensor data, and control
 */
export class ESP32Service {
  private mqttAdapter: MQTTAdapter | null = null;
  private db: DatabaseService;
  private io: SocketIOServer | null = null;
  private deviceHeartbeats: Map<string, NodeJS.Timeout> = new Map();
  private readonly HEARTBEAT_TIMEOUT = 30000; // 30 seconds

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Initialize the MQTT broker connection
   */
  async initialize(brokerHost: string = 'localhost', brokerPort: number = 1883): Promise<void> {
    logger.info(`Initializing ESP32 service with broker ${brokerHost}:${brokerPort}`);

    try {
      this.mqttAdapter = new MQTTAdapter();
      await this.mqttAdapter.connect({
        host: brokerHost,
        port: brokerPort,
        timeout: 30000,
        options: {
          clientId: `webscada_esp32_${Math.random().toString(16).slice(2, 8)}`,
          clean: true,
          keepalive: 60,
          reconnectPeriod: 5000,
        },
      });

      // Subscribe to all ESP32 device topics
      await this.subscribeToAllDeviceTopics();

      logger.info('ESP32 service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ESP32 service:', error);
      throw error;
    }
  }

  /**
   * Set Socket.IO instance for broadcasting events
   */
  setSocketIO(io: SocketIOServer): void {
    this.io = io;
    logger.info('Socket.IO instance set for ESP32 service');
  }

  /**
   * Register a new ESP32 device
   */
  async registerDevice(device: ESP32Device): Promise<ESP32Device> {
    logger.info(`Registering ESP32 device: ${device.name} (${device.id})`);

    try {
      // Save device to database
      await this.saveDeviceToDatabase(device);

      // Subscribe to device topics
      if (this.mqttAdapter) {
        await this.subscribeToDeviceTopics(device.id);
      }

      logger.info(`ESP32 device registered successfully: ${device.id}`);
      return device;
    } catch (error) {
      logger.error(`Failed to register ESP32 device ${device.id}:`, error);
      throw error;
    }
  }

  /**
   * Unregister an ESP32 device
   */
  async unregisterDevice(deviceId: string): Promise<void> {
    logger.info(`Unregistering ESP32 device: ${deviceId}`);

    // Clear heartbeat timeout
    const timeout = this.deviceHeartbeats.get(deviceId);
    if (timeout) {
      clearTimeout(timeout);
      this.deviceHeartbeats.delete(deviceId);
    }

    // Unsubscribe from device topics
    if (this.mqttAdapter) {
      this.mqttAdapter.unsubscribeFromDevice(deviceId);
    }

    // Remove from database
    await this.deleteDeviceFromDatabase(deviceId);

    logger.info(`ESP32 device unregistered: ${deviceId}`);
  }

  /**
   * Get ESP32 device by ID
   */
  async getDevice(deviceId: string): Promise<ESP32Device | null> {
    try {
      return await this.getDeviceFromDatabase(deviceId);
    } catch (error) {
      logger.error(`Failed to get device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * List all ESP32 devices
   */
  async listDevices(): Promise<ESP32Device[]> {
    try {
      return await this.getDevicesFromDatabase();
    } catch (error) {
      logger.error('Failed to list devices:', error);
      return [];
    }
  }

  /**
   * Get latest sensor data for a device
   */
  async getDeviceSensorData(deviceId: string): Promise<ESP32SensorData | null> {
    try {
      return await this.getSensorDataFromDatabase(deviceId);
    } catch (error) {
      logger.error(`Failed to get sensor data for ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Get sensor data history for a device
   */
  async getDeviceSensorHistory(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<ESP32SensorData[]> {
    try {
      return await this.getSensorHistoryFromDatabase(deviceId, startTime, endTime, limit);
    } catch (error) {
      logger.error(`Failed to get sensor history for ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Send control command to ESP32 device
   */
  async sendControlCommand(deviceId: string, command: ESP32ControlCommand): Promise<void> {
    logger.info(`Sending control command to ${deviceId}:`, command);

    if (!this.mqttAdapter) {
      throw new Error('MQTT adapter not initialized');
    }

    try {
      // Format command based on action
      let payload: any = {};

      switch (command.action) {
        case ESP32Action.SET_LED:
          payload = { action: 'setLED', ledState: command.ledState };
          break;
        case ESP32Action.TOGGLE_LED:
          payload = { action: 'toggleLED' };
          break;
        case ESP32Action.SET_RELAY:
          payload = {
            action: 'setRelay',
            relayIndex: command.relayIndex,
            relayState: command.relayState,
          };
          break;
        case ESP32Action.SET_OUTPUT:
          payload = {
            action: 'setOutput',
            outputPin: command.outputPin,
            outputState: command.outputState,
          };
          break;
        case ESP32Action.REQUEST_STATUS:
          payload = { action: 'requestStatus' };
          break;
        case ESP32Action.REBOOT:
          payload = { action: 'reboot' };
          break;
        case ESP32Action.CUSTOM:
          payload = {
            action: 'custom',
            ...(command.customCommand ? JSON.parse(command.customCommand) : {}),
          };
          break;
      }

      await this.mqttAdapter.publishControl(deviceId, payload);

      logger.info(`Control command sent successfully to ${deviceId}`);
    } catch (error) {
      logger.error(`Failed to send control command to ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to all device topics
   */
  private async subscribeToAllDeviceTopics(): Promise<void> {
    const devices = await this.getDevicesFromDatabase();

    for (const device of devices) {
      await this.subscribeToDeviceTopics(device.id);
    }

    logger.info(`Subscribed to ${devices.length} ESP32 devices`);
  }

  /**
   * Subscribe to device-specific topics
   */
  private async subscribeToDeviceTopics(deviceId: string): Promise<void> {
    if (!this.mqttAdapter) {
      logger.warn('MQTT adapter not initialized, cannot subscribe');
      return;
    }

    this.mqttAdapter.subscribeToDevice(deviceId, (topic, data) => {
      this.handleDeviceMessage(deviceId, topic, data);
    });

    logger.debug(`Subscribed to topics for device: ${deviceId}`);
  }

  /**
   * Handle incoming MQTT messages from devices
   */
  private async handleDeviceMessage(deviceId: string, topic: string, data: any): Promise<void> {
    logger.debug(`Received message from ${deviceId} on topic ${topic}`);

    try {
      // Determine message type from topic
      if (topic.endsWith('/data')) {
        await this.handleSensorData(deviceId, data);
      } else if (topic.endsWith('/online')) {
        await this.handleHeartbeat(deviceId, data);
      } else if (topic.endsWith('/status')) {
        await this.handleStatusUpdate(deviceId, data);
      }
    } catch (error) {
      logger.error(`Error handling message from ${deviceId}:`, error);
    }
  }

  /**
   * Handle sensor data from device
   */
  private async handleSensorData(deviceId: string, data: any): Promise<void> {
    try {
      const sensorData: ESP32SensorData = {
        deviceId,
        temperature: data.temperature,
        humidity: data.humidity,
        pressure: data.pressure,
        ledState: data.ledState,
        customData: data.customData,
        timestamp: new Date(data.timestamp || Date.now()),
      };

      // Save to database
      await this.saveSensorDataToDatabase(sensorData);

      // Update device last seen
      await this.updateDeviceLastSeen(deviceId);

      // Reset heartbeat timeout
      this.resetHeartbeatTimeout(deviceId);

      // Broadcast to connected clients
      this.broadcastSensorData(deviceId, sensorData);

      logger.debug(`Sensor data processed for ${deviceId}`);
    } catch (error) {
      logger.error(`Failed to handle sensor data for ${deviceId}:`, error);
    }
  }

  /**
   * Handle heartbeat message from device
   */
  private async handleHeartbeat(deviceId: string, data: any): Promise<void> {
    try {
      const heartbeat: ESP32HeartbeatPayload = {
        deviceId,
        status: data.status || 'online',
        uptime: data.uptime,
        freeHeap: data.freeHeap,
        wifiRssi: data.wifiRSSI,
        timestamp: new Date(),
      };

      // Update device status
      if (heartbeat.status === 'online') {
        await this.updateDeviceStatus(deviceId, DeviceStatus.ONLINE);
        this.broadcastDeviceOnline(deviceId);
      } else {
        await this.updateDeviceStatus(deviceId, DeviceStatus.OFFLINE);
        this.broadcastDeviceOffline(deviceId);
      }

      // Reset heartbeat timeout
      this.resetHeartbeatTimeout(deviceId);

      // Broadcast heartbeat
      this.broadcastHeartbeat(deviceId, heartbeat);

      logger.debug(`Heartbeat processed for ${deviceId}: ${heartbeat.status}`);
    } catch (error) {
      logger.error(`Failed to handle heartbeat for ${deviceId}:`, error);
    }
  }

  /**
   * Handle status update from device
   */
  private async handleStatusUpdate(deviceId: string, data: any): Promise<void> {
    try {
      const controlState: ESP32ControlState = {
        deviceId,
        outputs: data.outputStates || data.outputs || {},
        ledState: data.ledState || false,
        mode: data.mode,
        timestamp: new Date(),
      };

      // Update control state in database
      await this.updateControlStateInDatabase(deviceId, controlState);

      // Broadcast control state update
      this.broadcastControlState(deviceId, controlState);

      logger.debug(`Status update processed for ${deviceId}`);
    } catch (error) {
      logger.error(`Failed to handle status update for ${deviceId}:`, error);
    }
  }

  /**
   * Reset heartbeat timeout for a device
   */
  private resetHeartbeatTimeout(deviceId: string): void {
    // Clear existing timeout
    const existingTimeout = this.deviceHeartbeats.get(deviceId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      logger.warn(`Device ${deviceId} heartbeat timeout`);
      this.handleDeviceTimeout(deviceId);
    }, this.HEARTBEAT_TIMEOUT);

    this.deviceHeartbeats.set(deviceId, timeout);
  }

  /**
   * Handle device timeout (no heartbeat)
   */
  private async handleDeviceTimeout(deviceId: string): Promise<void> {
    logger.warn(`Device ${deviceId} timed out`);

    // Update device status to offline
    await this.updateDeviceStatus(deviceId, DeviceStatus.OFFLINE);

    // Broadcast offline event
    this.broadcastDeviceOffline(deviceId);
  }

  // Broadcast methods
  private broadcastSensorData(deviceId: string, sensorData: ESP32SensorData): void {
    if (this.io) {
      this.io.to(`esp32:${deviceId}`).emit('esp32:sensor-data', { deviceId, sensorData });
      this.io.emit('esp32:sensor-data-all', { deviceId, sensorData });
    }
  }

  private broadcastControlState(deviceId: string, controlState: ESP32ControlState): void {
    if (this.io) {
      this.io.to(`esp32:${deviceId}`).emit('esp32:control-state', { deviceId, controlState });
    }
  }

  private broadcastHeartbeat(deviceId: string, heartbeat: ESP32HeartbeatPayload): void {
    if (this.io) {
      this.io.to(`esp32:${deviceId}`).emit('esp32:heartbeat', heartbeat);
    }
  }

  private broadcastDeviceOnline(deviceId: string): void {
    if (this.io) {
      this.io.emit('esp32:device-online', { deviceId, timestamp: new Date() });
    }
  }

  private broadcastDeviceOffline(deviceId: string): void {
    if (this.io) {
      this.io.emit('esp32:device-offline', { deviceId, timestamp: new Date() });
    }
  }

  // Database methods (placeholder implementations)
  private async saveDeviceToDatabase(device: ESP32Device): Promise<void> {
    await this.db.query(
      `INSERT INTO esp32_devices (id, name, type, status, protocol, config, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = $2,
         type = $3,
         status = $4,
         config = $6,
         updated_at = NOW()`,
      [
        device.id,
        device.name,
        device.type,
        device.status,
        device.protocol,
        JSON.stringify(device.esp32Config),
      ]
    );
  }

  private async deleteDeviceFromDatabase(deviceId: string): Promise<void> {
    await this.db.query('DELETE FROM esp32_devices WHERE id = $1', [deviceId]);
  }

  private async getDeviceFromDatabase(deviceId: string): Promise<ESP32Device | null> {
    const result = await this.db.query<any>('SELECT * FROM esp32_devices WHERE id = $1', [
      deviceId,
    ]);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return this.mapRowToDevice(row);
  }

  private async getDevicesFromDatabase(): Promise<ESP32Device[]> {
    const result = await this.db.query<any>('SELECT * FROM esp32_devices ORDER BY created_at DESC');
    return result.map((row: any) => this.mapRowToDevice(row));
  }

  private async saveSensorDataToDatabase(sensorData: ESP32SensorData): Promise<void> {
    await this.db.query(
      `INSERT INTO esp32_sensor_data (device_id, temperature, humidity, pressure, led_state, custom_data, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        sensorData.deviceId,
        sensorData.temperature,
        sensorData.humidity,
        sensorData.pressure,
        sensorData.ledState,
        JSON.stringify(sensorData.customData || {}),
        sensorData.timestamp,
      ]
    );
  }

  private async getSensorDataFromDatabase(deviceId: string): Promise<ESP32SensorData | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM esp32_sensor_data WHERE device_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [deviceId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      deviceId: row.device_id,
      temperature: row.temperature,
      humidity: row.humidity,
      pressure: row.pressure,
      ledState: row.led_state,
      customData: row.custom_data,
      timestamp: new Date(row.timestamp),
    };
  }

  private async getSensorHistoryFromDatabase(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    limit: number
  ): Promise<ESP32SensorData[]> {
    const result = await this.db.query<any>(
      `SELECT * FROM esp32_sensor_data
       WHERE device_id = $1 AND timestamp >= $2 AND timestamp <= $3
       ORDER BY timestamp DESC LIMIT $4`,
      [deviceId, startTime, endTime, limit]
    );

    return result.map((row: any) => ({
      deviceId: row.device_id,
      temperature: row.temperature,
      humidity: row.humidity,
      pressure: row.pressure,
      ledState: row.led_state,
      customData: row.custom_data,
      timestamp: new Date(row.timestamp),
    }));
  }

  private async updateControlStateInDatabase(
    deviceId: string,
    controlState: ESP32ControlState
  ): Promise<void> {
    await this.db.query(
      `UPDATE esp32_devices
       SET control_state = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(controlState), deviceId]
    );
  }

  private async updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<void> {
    await this.db.query('UPDATE esp32_devices SET status = $1, updated_at = NOW() WHERE id = $2', [
      status,
      deviceId,
    ]);
  }

  private async updateDeviceLastSeen(deviceId: string): Promise<void> {
    await this.db.query(
      'UPDATE esp32_devices SET last_seen = NOW(), updated_at = NOW() WHERE id = $1',
      [deviceId]
    );
  }

  private mapRowToDevice(row: any): ESP32Device {
    const parsedConfig = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    return {
      id: row.id,
      device_id: row.device_id || row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      protocol: row.protocol,
      config: parsedConfig || {
        mqttClientId: '',
        mqttTopic: '',
        publishInterval: 5000,
        sensors: [],
      },
      connectionConfig: {
        host: 'localhost', // MQTT broker host
        port: 1883, // MQTT broker port
      },
      tags: [],
      esp32Config: parsedConfig,
      lastSeen: row.last_seen ? new Date(row.last_seen) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up ESP32 service');

    // Clear all heartbeat timeouts
    this.deviceHeartbeats.forEach((timeout) => clearTimeout(timeout));
    this.deviceHeartbeats.clear();

    // Disconnect MQTT adapter
    if (this.mqttAdapter) {
      await this.mqttAdapter.disconnect();
      this.mqttAdapter = null;
    }

    logger.info('ESP32 service cleaned up');
  }
}
