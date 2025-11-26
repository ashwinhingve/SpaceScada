import { GSMAdapter } from '@webscada/protocols';
import {
  GSMDevice,
  GSMDeviceConfig,
  ConnectionConfig,
  GSMNetworkStatus,
  GPSLocation,
  SMSMessage,
  SendSMSRequest,
  SendSMSResponse,
  GSMCommand,
  CommandStatus,
  SMSDirection,
  SMSStatus,
} from '@webscada/shared-types';
import { createLogger } from '@webscada/utils';

import { DatabaseService } from './database';

const logger = createLogger({ prefix: 'GSMService' });

/**
 * GSM Service
 * Manages GSM device operations, SMS, GPS, and network monitoring
 */
export class GSMService {
  private adapters: Map<string, GSMAdapter> = new Map();
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Register and connect to a GSM device
   */
  async registerDevice(device: GSMDevice): Promise<GSMDevice> {
    logger.info(`Registering GSM device: ${device.name} (${device.id})`);

    try {
      // Update device status to connecting
      device.status = 'CONNECTING' as any;

      // Save device to database
      await this.saveDeviceToDatabase(device);

      // Create and connect adapter
      const adapter = new GSMAdapter();

      try {
        const connectionConfig: any = device.connectionConfig || { host: 'localhost', port: 8080 };
        await adapter.connect({
          host: connectionConfig.host,
          port: connectionConfig.port,
          timeout: connectionConfig.timeout || 30000,
          retryAttempts: connectionConfig.retryAttempts || 3,
          retryDelay: connectionConfig.retryDelay || 5000,
          options: (device.gsmConfig || {}) as unknown as Record<string, unknown>,
        });

        this.adapters.set(device.id, adapter);

        // Update device status to online
        device.status = 'ONLINE' as any;
        await this.saveDeviceToDatabase(device);

        logger.info(`GSM device registered and connected successfully: ${device.id}`);
      } catch (connectError) {
        logger.warn(`GSM device registered but connection failed: ${device.id}`, connectError);

        // Update device status to offline but keep it registered
        device.status = 'OFFLINE' as any;
        await this.saveDeviceToDatabase(device);

        // Don't throw error - device is registered but offline
      }

      return device;
    } catch (error) {
      logger.error(`Failed to register GSM device ${device.id}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect and unregister a GSM device
   */
  async unregisterDevice(deviceId: string): Promise<void> {
    logger.info(`Unregistering GSM device: ${deviceId}`);

    const adapter = this.adapters.get(deviceId);
    if (adapter) {
      await adapter.disconnect();
      this.adapters.delete(deviceId);
    }

    // Remove from database
    await this.deleteDeviceFromDatabase(deviceId);

    logger.info(`GSM device unregistered: ${deviceId}`);
  }

  /**
   * Get GSM device by ID
   */
  async getDevice(deviceId: string): Promise<GSMDevice | null> {
    try {
      return await this.getDeviceFromDatabase(deviceId);
    } catch (error) {
      logger.error(`Failed to get device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * List all GSM devices
   */
  async listDevices(): Promise<GSMDevice[]> {
    try {
      return await this.getDevicesFromDatabase();
    } catch (error) {
      logger.error('Failed to list devices:', error);
      return [];
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(deviceId: string, request: SendSMSRequest): Promise<SendSMSResponse> {
    logger.info(`Sending SMS from device ${deviceId} to ${request.phoneNumber}`);

    const adapter = this.getAdapter(deviceId);
    const response = await adapter.sendSMS(request);

    // Save SMS to database
    const sms: SMSMessage = {
      id: response.messageId,
      deviceId,
      direction: SMSDirection.OUTBOUND,
      phoneNumber: request.phoneNumber,
      message: request.message,
      status: response.status,
      timestamp: response.timestamp,
    };

    await this.saveSMSToDatabase(sms);

    return response;
  }

  /**
   * Get SMS messages for a device
   */
  async getSMSMessages(
    deviceId: string,
    filter?: { direction?: SMSDirection; status?: SMSStatus; limit?: number }
  ): Promise<SMSMessage[]> {
    try {
      return await this.getSMSFromDatabase(deviceId, filter);
    } catch (error) {
      logger.error(`Failed to get SMS messages for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Read new SMS messages from device and sync to database
   */
  async syncSMS(deviceId: string): Promise<SMSMessage[]> {
    logger.info(`Syncing SMS for device ${deviceId}`);

    const adapter = this.getAdapter(deviceId);
    const messages = await adapter.readSMS('UNREAD');

    // Save new messages to database
    for (const message of messages) {
      await this.saveSMSToDatabase({
        ...message,
        deviceId,
      });
    }

    return messages;
  }

  /**
   * Get GPS location
   */
  async getGPSLocation(deviceId: string): Promise<GPSLocation> {
    logger.info(`Getting GPS location for device ${deviceId}`);

    const adapter = this.getAdapter(deviceId);
    const location = await adapter.getGPSLocation();

    // Save location to database
    await this.saveLocationToDatabase(deviceId, location);

    return location;
  }

  /**
   * Get location history
   */
  async getLocationHistory(deviceId: string, limit: number = 100): Promise<GPSLocation[]> {
    try {
      return await this.getLocationsFromDatabase(deviceId, limit);
    } catch (error) {
      logger.error(`Failed to get location history for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(deviceId: string): Promise<GSMNetworkStatus> {
    logger.info(`Getting network status for device ${deviceId}`);

    const adapter = this.getAdapter(deviceId);
    const status = await adapter.getNetworkStatus();

    // Save status to database
    await this.saveNetworkStatusToDatabase(deviceId, status);

    return status;
  }

  /**
   * Get network status history
   */
  async getNetworkStatusHistory(
    deviceId: string,
    limit: number = 100
  ): Promise<GSMNetworkStatus[]> {
    try {
      return await this.getNetworkStatusFromDatabase(deviceId, limit);
    } catch (error) {
      logger.error(`Failed to get network status history for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Send AT command
   */
  async sendCommand(deviceId: string, command: string, data?: string): Promise<GSMCommand> {
    logger.info(`Sending AT command to device ${deviceId}: ${command}`);

    const adapter = this.getAdapter(deviceId);

    const cmd: GSMCommand = {
      id: this.generateCommandId(),
      deviceId,
      command,
      status: CommandStatus.PENDING,
      sentAt: new Date(),
    };

    try {
      const response = await adapter.sendATCommand(command, data);

      cmd.response = response;
      cmd.status = CommandStatus.SUCCESS;
      cmd.completedAt = new Date();
    } catch (error) {
      cmd.status = CommandStatus.FAILED;
      cmd.response = (error as Error).message;
      cmd.completedAt = new Date();
    }

    // Save command to database
    await this.saveCommandToDatabase(cmd);

    return cmd;
  }

  /**
   * Get command history
   */
  async getCommandHistory(deviceId: string, limit: number = 50): Promise<GSMCommand[]> {
    try {
      return await this.getCommandsFromDatabase(deviceId, limit);
    } catch (error) {
      logger.error(`Failed to get command history for device ${deviceId}:`, error);
      return [];
    }
  }

  // ===== Private Helper Methods =====

  private getAdapter(deviceId: string): GSMAdapter {
    const adapter = this.adapters.get(deviceId);
    if (!adapter) {
      throw new Error(`GSM device ${deviceId} not connected`);
    }
    return adapter;
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== Database Methods (Stubs - to be implemented) =====

  private async saveDeviceToDatabase(device: GSMDevice): Promise<void> {
    // First, insert or update the base devices table
    const devicesQuery = `
      INSERT INTO devices (id, device_id, name, description, device_type, status, created_at, updated_at, last_seen)
      VALUES ($1, $2, $3, $4, 'GSM_ESP32', $5, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = $3,
        description = $4,
        status = $5,
        updated_at = NOW(),
        last_seen = NOW()
    `;

    await this.db.query(devicesQuery, [
      device.id,
      device.device_id || device.id,
      device.name,
      device.description || '',
      device.status,
    ]);

    // Then, insert or update the gsm_devices table
    const gsmConfig: Partial<GSMDeviceConfig> = device.gsmConfig || {};
    const connectionConfig: Partial<ConnectionConfig> = device.connectionConfig || {};

    const gsmDevicesQuery = `
      INSERT INTO gsm_devices (
        device_id, imei, iccid, imsi, apn, apn_username, apn_password,
        mqtt_client_id, mqtt_username, mqtt_password, mqtt_broker_host,
        mqtt_broker_port, mqtt_use_tls, mqtt_topic_prefix,
        modem_model, firmware_version, signal_strength, signal_quality,
        network_type, operator, battery_voltage, battery_percentage,
        power_mode, publish_interval, heartbeat_interval, enable_ota,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
        NOW(), NOW()
      )
      ON CONFLICT (device_id) DO UPDATE SET
        signal_strength = $17,
        signal_quality = $18,
        network_type = $19,
        operator = $20,
        battery_voltage = $21,
        battery_percentage = $22,
        updated_at = NOW()
    `;

    await this.db.query(gsmDevicesQuery, [
      device.id,
      gsmConfig.imei || '',
      gsmConfig.iccid || '',
      gsmConfig.imsi || '',
      gsmConfig.apn || (connectionConfig.options as any)?.apn || 'internet',
      gsmConfig.apn_username || '',
      gsmConfig.apn_password || '',
      gsmConfig.mqtt_client_id || `gsm-${device.id}`,
      (connectionConfig.options as any)?.mqttUsername || '',
      (connectionConfig.options as any)?.mqttPassword || '',
      connectionConfig.host || 'mqtt.webscada.io',
      connectionConfig.port || 8883,
      true,
      `webscada/gsm/${device.id}`,
      gsmConfig.modem_model || 'SIM7600',
      gsmConfig.firmware_version || '1.0.0',
      (gsmConfig as any).signal_strength || 0,
      (gsmConfig as any).signal_quality || 0,
      (gsmConfig as any).network_type || '4G',
      (gsmConfig as any).operator || '',
      (gsmConfig as any).battery_voltage || 0,
      (gsmConfig as any).battery_percentage || 0,
      (gsmConfig as any).power_mode || 'NORMAL',
      gsmConfig.publish_interval || 60000,
      gsmConfig.heartbeat_interval || 300000,
      gsmConfig.enable_ota !== false,
    ]);
  }

  private async deleteDeviceFromDatabase(deviceId: string): Promise<void> {
    // Delete from gsm_devices first (foreign key constraint)
    const gsmQuery = 'DELETE FROM gsm_devices WHERE device_id = $1';
    await this.db.query(gsmQuery, [deviceId]);

    // Then delete from base devices table
    const devicesQuery = 'DELETE FROM devices WHERE id = $1';
    await this.db.query(devicesQuery, [deviceId]);
  }

  private async getDeviceFromDatabase(deviceId: string): Promise<GSMDevice | null> {
    const query = `
      SELECT
        d.id, d.device_id, d.name, d.description, d.device_type, d.status,
        d.latitude, d.longitude, d.altitude, d.location_name,
        d.tags, d.metadata, d.created_at, d.updated_at, d.last_seen,
        g.imei, g.iccid, g.imsi, g.apn, g.apn_username, g.apn_password,
        g.mqtt_client_id, g.mqtt_username, g.mqtt_password,
        g.mqtt_broker_host, g.mqtt_broker_port, g.mqtt_use_tls, g.mqtt_topic_prefix,
        g.modem_model, g.firmware_version,
        g.signal_strength, g.signal_quality, g.network_type, g.operator,
        g.battery_voltage, g.battery_percentage, g.power_mode,
        g.publish_interval, g.heartbeat_interval, g.enable_ota
      FROM devices d
      INNER JOIN gsm_devices g ON d.id = g.device_id
      WHERE d.id = $1
    `;
    const result = await this.db.query<any>(query, [deviceId]);

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToGSMDevice(result[0]);
  }

  private async getDevicesFromDatabase(): Promise<GSMDevice[]> {
    const query = `
      SELECT
        d.id, d.device_id, d.name, d.description, d.device_type, d.status,
        d.latitude, d.longitude, d.altitude, d.location_name,
        d.tags, d.metadata, d.created_at, d.updated_at, d.last_seen,
        g.imei, g.iccid, g.imsi, g.apn, g.apn_username, g.apn_password,
        g.mqtt_client_id, g.mqtt_username, g.mqtt_password,
        g.mqtt_broker_host, g.mqtt_broker_port, g.mqtt_use_tls, g.mqtt_topic_prefix,
        g.modem_model, g.firmware_version,
        g.signal_strength, g.signal_quality, g.network_type, g.operator,
        g.battery_voltage, g.battery_percentage, g.power_mode,
        g.publish_interval, g.heartbeat_interval, g.enable_ota
      FROM devices d
      INNER JOIN gsm_devices g ON d.id = g.device_id
      WHERE d.device_type = 'GSM_ESP32'
      ORDER BY d.created_at DESC
    `;
    const result = await this.db.query<any>(query);

    return result.map((row: any) => this.mapRowToGSMDevice(row));
  }

  private async saveSMSToDatabase(sms: SMSMessage): Promise<void> {
    const query = `
      INSERT INTO gsm_messages (id, device_id, direction, phone_number, message, status, timestamp, delivered_at, read_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        status = $6,
        delivered_at = $8,
        read_at = $9
    `;

    await this.db.query(query, [
      sms.id,
      sms.deviceId,
      sms.direction,
      sms.phoneNumber,
      sms.message,
      sms.status,
      sms.timestamp,
      sms.deliveredAt || null,
      sms.readAt || null,
    ]);
  }

  private async getSMSFromDatabase(
    deviceId: string,
    filter?: { direction?: SMSDirection; status?: SMSStatus; limit?: number }
  ): Promise<SMSMessage[]> {
    let query = 'SELECT * FROM gsm_messages WHERE device_id = $1';
    const params: any[] = [deviceId];
    let paramIndex = 2;

    if (filter?.direction) {
      query += ` AND direction = $${paramIndex}`;
      params.push(filter.direction);
      paramIndex++;
    }

    if (filter?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filter.status);
      paramIndex++;
    }

    query += ' ORDER BY timestamp DESC';

    if (filter?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filter.limit);
    }

    const result = await this.db.query<SMSMessage>(query, params);
    return result;
  }

  private async saveLocationToDatabase(deviceId: string, location: GPSLocation): Promise<void> {
    const query = `
      INSERT INTO gsm_locations (device_id, latitude, longitude, altitude, speed, heading, accuracy, satellites, hdop, fix, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await this.db.query(query, [
      deviceId,
      location.latitude,
      location.longitude,
      location.altitude || null,
      location.speed || null,
      location.heading || null,
      location.accuracy || null,
      location.satellites || null,
      location.hdop || null,
      location.fix,
      location.timestamp,
    ]);
  }

  private async getLocationsFromDatabase(deviceId: string, limit: number): Promise<GPSLocation[]> {
    const query = `
      SELECT * FROM gsm_locations
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await this.db.query<GPSLocation>(query, [deviceId, limit]);
    return result;
  }

  private async saveNetworkStatusToDatabase(
    deviceId: string,
    status: GSMNetworkStatus
  ): Promise<void> {
    const query = `
      INSERT INTO gsm_network_logs (
        device_id, operator, signal_strength, signal_quality, network_type,
        registered, roaming, ip_address, imei, iccid, sim_status,
        data_sent_bytes, data_received_bytes, timestamp
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    await this.db.query(query, [
      deviceId,
      status.operator,
      status.signalStrength,
      status.signalQuality,
      status.networkType,
      status.registered,
      status.roaming,
      status.ipAddress || null,
      status.imei,
      status.iccid,
      status.simStatus,
      status.dataUsage?.sent || 0,
      status.dataUsage?.received || 0,
      status.timestamp,
    ]);
  }

  private async getNetworkStatusFromDatabase(
    deviceId: string,
    limit: number
  ): Promise<GSMNetworkStatus[]> {
    const query = `
      SELECT * FROM gsm_network_logs
      WHERE device_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await this.db.query<any>(query, [deviceId, limit]);
    return result.map((row: any) => ({
      operator: row.operator,
      signalStrength: row.signal_strength,
      signalQuality: row.signal_quality,
      networkType: row.network_type,
      registered: row.registered,
      roaming: row.roaming,
      ipAddress: row.ip_address,
      imei: row.imei,
      iccid: row.iccid,
      simStatus: row.sim_status,
      dataUsage: {
        sent: row.data_sent_bytes || 0,
        received: row.data_received_bytes || 0,
      },
      timestamp: row.timestamp,
    }));
  }

  private async saveCommandToDatabase(cmd: GSMCommand): Promise<void> {
    const query = `
      INSERT INTO gsm_commands (id, device_id, command, response, status, sent_at, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.db.query(query, [
      cmd.id,
      cmd.deviceId,
      cmd.command,
      cmd.response || null,
      cmd.status,
      cmd.sentAt,
      cmd.completedAt || null,
    ]);
  }

  private async getCommandsFromDatabase(deviceId: string, limit: number): Promise<GSMCommand[]> {
    const query = `
      SELECT * FROM gsm_commands
      WHERE device_id = $1
      ORDER BY sent_at DESC
      LIMIT $2
    `;

    const result = await this.db.query<any>(query, [deviceId, limit]);
    return result.map((row: any) => ({
      id: row.id,
      deviceId: row.device_id,
      command: row.command,
      response: row.response,
      status: row.status,
      sentAt: row.sent_at,
      completedAt: row.completed_at,
    }));
  }

  private mapRowToGSMDevice(row: any): GSMDevice {
    return {
      id: row.id,
      device_id: row.device_id,
      name: row.name,
      description: row.description || '',
      device_type: row.device_type,
      type: row.device_type,
      status: row.status,
      protocol: 'GSM_MQTT',
      config: {
        imei: row.imei,
        iccid: row.iccid,
        imsi: row.imsi,
        apn: row.apn,
        apn_username: row.apn_username,
        apn_password: row.apn_password,
        mqtt_client_id: row.mqtt_client_id,
        mqtt_username: row.mqtt_username,
        mqtt_password: row.mqtt_password,
        mqtt_broker_host: row.mqtt_broker_host,
        mqtt_broker_port: row.mqtt_broker_port,
        mqtt_use_tls: row.mqtt_use_tls,
        mqtt_topic_prefix: row.mqtt_topic_prefix,
        modem_model: row.modem_model,
        firmware_version: row.firmware_version,
        publish_interval: row.publish_interval,
        heartbeat_interval: row.heartbeat_interval,
        enable_ota: row.enable_ota,
      },
      connectionConfig: {
        host: row.mqtt_broker_host || 'mqtt.webscada.io',
        port: row.mqtt_broker_port || 8883,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 5000,
        options: {
          apn: row.apn,
          mqttUsername: row.mqtt_username,
          mqttPassword: row.mqtt_password,
        },
      } as any,
      gsmConfig: {
        imei: row.imei,
        iccid: row.iccid,
        imsi: row.imsi,
        apn: row.apn,
        apn_username: row.apn_username,
        apn_password: row.apn_password,
        mqtt_client_id: row.mqtt_client_id,
        mqtt_username: row.mqtt_username,
        mqtt_password: row.mqtt_password,
        mqtt_broker_host: row.mqtt_broker_host,
        mqtt_broker_port: row.mqtt_broker_port,
        mqtt_use_tls: row.mqtt_use_tls,
        mqtt_topic_prefix: row.mqtt_topic_prefix,
        modem_model: row.modem_model,
        firmware_version: row.firmware_version,
        publish_interval: row.publish_interval,
        heartbeat_interval: row.heartbeat_interval,
        enable_ota: row.enable_ota,
      },
      tags: Array.isArray(row.tags) ? row.tags : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
