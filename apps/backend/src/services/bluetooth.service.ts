/**
 * Bluetooth Device Service
 * Handles Bluetooth and BLE device management operations
 */

import { Pool } from 'pg';
import { DatabaseService } from './database';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'BluetoothService' });

export interface BluetoothDeviceData {
  id?: string;
  name: string;
  mac_address: string;
  application_id: string;
  description?: string;
  status?: 'online' | 'offline' | 'error';
  protocol?: 'BLE' | 'Classic';
  signal_strength?: number;
  battery_level?: number;
  firmware_version?: string;
  hardware_version?: string;
  manufacturer?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata?: Record<string, any>;
}

export interface BluetoothDeviceUpdateData {
  name?: string;
  description?: string;
  status?: 'online' | 'offline' | 'error';
  protocol?: 'BLE' | 'Classic';
  signal_strength?: number;
  battery_level?: number;
  firmware_version?: string;
  hardware_version?: string;
  manufacturer?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata?: Record<string, any>;
}

export class BluetoothService {
  private db: Pool;

  constructor(database: DatabaseService) {
    this.db = database.getPool();
  }

  /**
   * List all Bluetooth devices
   */
  async listDevices(applicationId?: string): Promise<any[]> {
    try {
      let query = `
        SELECT
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM bluetooth_devices
      `;

      const params: any[] = [];

      if (applicationId) {
        query += ' WHERE application_id = $1';
        params.push(applicationId);
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to list Bluetooth devices', { error });
      throw new Error('Failed to list Bluetooth devices');
    }
  }

  /**
   * Get a single Bluetooth device by ID
   */
  async getDevice(id: string): Promise<any> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM bluetooth_devices
        WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Bluetooth device not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get Bluetooth device', { id, error });
      throw error;
    }
  }

  /**
   * Get a Bluetooth device by MAC address
   */
  async getDeviceByMacAddress(macAddress: string): Promise<any> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM bluetooth_devices
        WHERE mac_address = $1`,
        [macAddress]
      );

      if (result.rows.length === 0) {
        throw new Error('Bluetooth device not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get Bluetooth device by MAC address', { macAddress, error });
      throw error;
    }
  }

  /**
   * Create a new Bluetooth device
   */
  async createDevice(deviceData: BluetoothDeviceData): Promise<any> {
    try {
      const result = await this.db.query(
        `INSERT INTO bluetooth_devices (
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          location,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at`,
        [
          deviceData.name,
          deviceData.mac_address,
          deviceData.application_id,
          deviceData.description || null,
          deviceData.status || 'offline',
          deviceData.protocol || 'BLE',
          deviceData.signal_strength || null,
          deviceData.battery_level || null,
          deviceData.firmware_version || null,
          deviceData.hardware_version || null,
          deviceData.manufacturer || null,
          deviceData.location ? JSON.stringify(deviceData.location) : null,
          deviceData.metadata ? JSON.stringify(deviceData.metadata) : null,
        ]
      );

      logger.info('Bluetooth device created', { id: result.rows[0].id, macAddress: deviceData.mac_address });
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Bluetooth device with this MAC address already exists');
      }
      logger.error('Failed to create Bluetooth device', { error });
      throw new Error('Failed to create Bluetooth device');
    }
  }

  /**
   * Update a Bluetooth device
   */
  async updateDevice(id: string, updateData: BluetoothDeviceUpdateData): Promise<any> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updateData.name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        values.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        setClauses.push(`description = $${paramIndex++}`);
        values.push(updateData.description);
      }
      if (updateData.status !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        values.push(updateData.status);
      }
      if (updateData.protocol !== undefined) {
        setClauses.push(`protocol = $${paramIndex++}`);
        values.push(updateData.protocol);
      }
      if (updateData.signal_strength !== undefined) {
        setClauses.push(`signal_strength = $${paramIndex++}`);
        values.push(updateData.signal_strength);
      }
      if (updateData.battery_level !== undefined) {
        setClauses.push(`battery_level = $${paramIndex++}`);
        values.push(updateData.battery_level);
      }
      if (updateData.firmware_version !== undefined) {
        setClauses.push(`firmware_version = $${paramIndex++}`);
        values.push(updateData.firmware_version);
      }
      if (updateData.hardware_version !== undefined) {
        setClauses.push(`hardware_version = $${paramIndex++}`);
        values.push(updateData.hardware_version);
      }
      if (updateData.manufacturer !== undefined) {
        setClauses.push(`manufacturer = $${paramIndex++}`);
        values.push(updateData.manufacturer);
      }
      if (updateData.location !== undefined) {
        setClauses.push(`location = $${paramIndex++}`);
        values.push(JSON.stringify(updateData.location));
      }
      if (updateData.metadata !== undefined) {
        setClauses.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(updateData.metadata));
      }

      if (setClauses.length === 0) {
        throw new Error('No update data provided');
      }

      values.push(id);

      const result = await this.db.query(
        `UPDATE bluetooth_devices
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Bluetooth device not found');
      }

      logger.info('Bluetooth device updated', { id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update Bluetooth device', { id, error });
      throw error;
    }
  }

  /**
   * Delete a Bluetooth device
   */
  async deleteDevice(id: string): Promise<void> {
    try {
      const result = await this.db.query(
        'DELETE FROM bluetooth_devices WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Bluetooth device not found');
      }

      logger.info('Bluetooth device deleted', { id });
    } catch (error) {
      logger.error('Failed to delete Bluetooth device', { id, error });
      throw error;
    }
  }

  /**
   * Update device status and last seen timestamp
   */
  async updateStatus(id: string, status: 'online' | 'offline' | 'error'): Promise<void> {
    try {
      await this.db.query(
        'UPDATE bluetooth_devices SET status = $1, last_seen = NOW() WHERE id = $2',
        [status, id]
      );
      logger.info('Bluetooth device status updated', { id, status });
    } catch (error) {
      logger.error('Failed to update Bluetooth device status', { id, error });
      throw error;
    }
  }

  /**
   * Update battery level
   */
  async updateBatteryLevel(id: string, batteryLevel: number): Promise<void> {
    try {
      await this.db.query(
        'UPDATE bluetooth_devices SET battery_level = $1, last_seen = NOW() WHERE id = $2',
        [batteryLevel, id]
      );
      logger.info('Bluetooth device battery level updated', { id, batteryLevel });
    } catch (error) {
      logger.error('Failed to update Bluetooth device battery level', { id, error });
      throw error;
    }
  }

  /**
   * Update signal strength
   */
  async updateSignalStrength(id: string, signalStrength: number): Promise<void> {
    try {
      await this.db.query(
        'UPDATE bluetooth_devices SET signal_strength = $1, last_seen = NOW() WHERE id = $2',
        [signalStrength, id]
      );
      logger.info('Bluetooth device signal strength updated', { id, signalStrength });
    } catch (error) {
      logger.error('Failed to update Bluetooth device signal strength', { id, error });
      throw error;
    }
  }

  /**
   * Get devices by status
   */
  async getDevicesByStatus(status: 'online' | 'offline' | 'error'): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM bluetooth_devices
        WHERE status = $1
        ORDER BY created_at DESC`,
        [status]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get Bluetooth devices by status', { status, error });
      throw error;
    }
  }

  /**
   * Get devices with low battery
   */
  async getDevicesWithLowBattery(threshold: number = 30): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM bluetooth_devices
        WHERE battery_level IS NOT NULL AND battery_level < $1
        ORDER BY battery_level ASC`,
        [threshold]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get Bluetooth devices with low battery', { threshold, error });
      throw error;
    }
  }

  /**
   * Get devices by protocol
   */
  async getDevicesByProtocol(protocol: 'BLE' | 'Classic'): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          protocol,
          signal_strength,
          battery_level,
          firmware_version,
          hardware_version,
          manufacturer,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM bluetooth_devices
        WHERE protocol = $1
        ORDER BY created_at DESC`,
        [protocol]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get Bluetooth devices by protocol', { protocol, error });
      throw error;
    }
  }
}
