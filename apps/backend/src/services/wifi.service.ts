/**
 * WiFi Device Service
 * Handles Wi-Fi device management operations
 */

import { Pool } from 'pg';
import { DatabaseService } from './database';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'WiFiService' });

export interface WiFiDeviceData {
  id?: string;
  name: string;
  mac_address: string;
  application_id: string;
  description?: string;
  status?: 'online' | 'offline' | 'error';
  ssid?: string;
  signal_strength?: number;
  ip_address?: string;
  chipset?: string;
  firmware_version?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata?: Record<string, any>;
}

export interface WiFiDeviceUpdateData {
  name?: string;
  description?: string;
  status?: 'online' | 'offline' | 'error';
  ssid?: string;
  signal_strength?: number;
  ip_address?: string;
  chipset?: string;
  firmware_version?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata?: Record<string, any>;
}

export class WiFiService {
  private db: Pool;

  constructor(database: DatabaseService) {
    this.db = database.getPool();
  }

  /**
   * List all Wi-Fi devices
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
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM wifi_devices
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
      logger.error('Failed to list Wi-Fi devices', { error });
      throw new Error('Failed to list Wi-Fi devices');
    }
  }

  /**
   * Get a single Wi-Fi device by ID
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
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM wifi_devices
        WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Wi-Fi device not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get Wi-Fi device', { id, error });
      throw error;
    }
  }

  /**
   * Get a Wi-Fi device by MAC address
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
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM wifi_devices
        WHERE mac_address = $1`,
        [macAddress]
      );

      if (result.rows.length === 0) {
        throw new Error('Wi-Fi device not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get Wi-Fi device by MAC address', { macAddress, error });
      throw error;
    }
  }

  /**
   * Create a new Wi-Fi device
   */
  async createDevice(deviceData: WiFiDeviceData): Promise<any> {
    try {
      const result = await this.db.query(
        `INSERT INTO wifi_devices (
          name,
          mac_address,
          application_id,
          description,
          status,
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
          location,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
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
          deviceData.ssid || null,
          deviceData.signal_strength || null,
          deviceData.ip_address || null,
          deviceData.chipset || null,
          deviceData.firmware_version || null,
          deviceData.location ? JSON.stringify(deviceData.location) : null,
          deviceData.metadata ? JSON.stringify(deviceData.metadata) : null,
        ]
      );

      logger.info('Wi-Fi device created', { id: result.rows[0].id, macAddress: deviceData.mac_address });
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Wi-Fi device with this MAC address already exists');
      }
      logger.error('Failed to create Wi-Fi device', { error });
      throw new Error('Failed to create Wi-Fi device');
    }
  }

  /**
   * Update a Wi-Fi device
   */
  async updateDevice(id: string, updateData: WiFiDeviceUpdateData): Promise<any> {
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
      if (updateData.ssid !== undefined) {
        setClauses.push(`ssid = $${paramIndex++}`);
        values.push(updateData.ssid);
      }
      if (updateData.signal_strength !== undefined) {
        setClauses.push(`signal_strength = $${paramIndex++}`);
        values.push(updateData.signal_strength);
      }
      if (updateData.ip_address !== undefined) {
        setClauses.push(`ip_address = $${paramIndex++}`);
        values.push(updateData.ip_address);
      }
      if (updateData.chipset !== undefined) {
        setClauses.push(`chipset = $${paramIndex++}`);
        values.push(updateData.chipset);
      }
      if (updateData.firmware_version !== undefined) {
        setClauses.push(`firmware_version = $${paramIndex++}`);
        values.push(updateData.firmware_version);
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
        `UPDATE wifi_devices
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Wi-Fi device not found');
      }

      logger.info('Wi-Fi device updated', { id });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update Wi-Fi device', { id, error });
      throw error;
    }
  }

  /**
   * Delete a Wi-Fi device
   */
  async deleteDevice(id: string): Promise<void> {
    try {
      const result = await this.db.query(
        'DELETE FROM wifi_devices WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Wi-Fi device not found');
      }

      logger.info('Wi-Fi device deleted', { id });
    } catch (error) {
      logger.error('Failed to delete Wi-Fi device', { id, error });
      throw error;
    }
  }

  /**
   * Update device status and last seen timestamp
   */
  async updateStatus(id: string, status: 'online' | 'offline' | 'error'): Promise<void> {
    try {
      await this.db.query(
        'UPDATE wifi_devices SET status = $1, last_seen = NOW() WHERE id = $2',
        [status, id]
      );
      logger.info('Wi-Fi device status updated', { id, status });
    } catch (error) {
      logger.error('Failed to update Wi-Fi device status', { id, error });
      throw error;
    }
  }

  /**
   * Update signal strength
   */
  async updateSignalStrength(id: string, signalStrength: number): Promise<void> {
    try {
      await this.db.query(
        'UPDATE wifi_devices SET signal_strength = $1, last_seen = NOW() WHERE id = $2',
        [signalStrength, id]
      );
      logger.info('Wi-Fi device signal strength updated', { id, signalStrength });
    } catch (error) {
      logger.error('Failed to update Wi-Fi device signal strength', { id, error });
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
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM wifi_devices
        WHERE status = $1
        ORDER BY created_at DESC`,
        [status]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get Wi-Fi devices by status', { status, error });
      throw error;
    }
  }

  /**
   * Get devices with weak signal
   */
  async getDevicesWithWeakSignal(threshold: number = 50): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          name,
          mac_address,
          application_id,
          description,
          status,
          ssid,
          signal_strength,
          ip_address,
          chipset,
          firmware_version,
          last_seen,
          location,
          metadata,
          created_at,
          updated_at
        FROM wifi_devices
        WHERE signal_strength IS NOT NULL AND signal_strength < $1
        ORDER BY signal_strength ASC`,
        [threshold]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get Wi-Fi devices with weak signal', { threshold, error });
      throw error;
    }
  }
}
