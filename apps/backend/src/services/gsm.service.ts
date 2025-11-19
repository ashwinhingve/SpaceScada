import {
  GSMDevice,
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
import { GSMAdapter } from '@webscada/protocols';
import { DatabaseService } from './database';
import { createLogger } from '@webscada/utils';

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
        await adapter.connect({
          host: device.connectionConfig.host,
          port: device.connectionConfig.port,
          timeout: device.connectionConfig.timeout || 30000,
          retryAttempts: device.connectionConfig.retryAttempts || 3,
          retryDelay: device.connectionConfig.retryDelay || 5000,
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
    const query = `
      INSERT INTO devices (id, name, type, status, protocol, connection_config, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = $2,
        type = $3,
        status = $4,
        protocol = $5,
        connection_config = $6,
        updated_at = NOW()
    `;

    await this.db.query(query, [
      device.id,
      device.name,
      device.type,
      device.status,
      device.protocol,
      JSON.stringify({
        ...device.connectionConfig,
        gsmConfig: device.gsmConfig,
      }) as unknown as Record<string, unknown>,
    ]);
  }

  private async deleteDeviceFromDatabase(deviceId: string): Promise<void> {
    const query = 'DELETE FROM devices WHERE id = $1';
    await this.db.query(query, [deviceId]);
  }

  private async getDeviceFromDatabase(deviceId: string): Promise<GSMDevice | null> {
    const query = 'SELECT * FROM devices WHERE id = $1';
    const result = await this.db.query<any>(query, [deviceId]);

    if (result.length === 0) {
      return null;
    }

    return this.mapRowToGSMDevice(result[0]);
  }

  private async getDevicesFromDatabase(): Promise<GSMDevice[]> {
    const query = `
      SELECT * FROM devices
      WHERE protocol IN ('GSM_HTTP', 'GSM_MQTT')
      ORDER BY created_at DESC
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
      status.dataUsage?.sentBytes || 0,
      status.dataUsage?.receivedBytes || 0,
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
        sentBytes: row.data_sent_bytes,
        receivedBytes: row.data_received_bytes,
        totalBytes: row.data_sent_bytes + row.data_received_bytes,
        resetDate: new Date(),
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
    const config =
      typeof row.connection_config === 'string'
        ? JSON.parse(row.connection_config)
        : row.connection_config;

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      protocol: row.protocol,
      connectionConfig: {
        host: config.host,
        port: config.port,
        timeout: config.timeout,
        retryAttempts: config.retryAttempts,
        retryDelay: config.retryDelay,
        options: config.gsmConfig,
      },
      gsmConfig: config.gsmConfig || {},
      tags: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
