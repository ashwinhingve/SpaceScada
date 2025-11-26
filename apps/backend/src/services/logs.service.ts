/**
 * Logs Service
 * Handles device event logging and audit trails for all device types
 */

import { Pool } from 'pg';
import { DatabaseService } from './database';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'LogsService' });

export type DeviceType = 'lorawan' | 'gsm' | 'wifi' | 'bluetooth';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface DeviceLogData {
  device_id: string;
  device_type: DeviceType;
  log_level: LogLevel;
  event_type: string;
  message: string;
  details?: Record<string, any>;
  timestamp?: Date;
}

export interface LogQuery {
  device_id?: string;
  device_type?: DeviceType;
  log_level?: LogLevel;
  event_type?: string;
  start_time?: Date;
  end_time?: Date;
  limit?: number;
}

export interface DeviceLog {
  id: string;
  device_id: string;
  device_type: DeviceType;
  log_level: LogLevel;
  event_type: string;
  message: string;
  details: Record<string, any> | null;
  timestamp: Date;
  created_at: Date;
}

export interface DeviceConfiguration {
  id: string;
  device_id: string;
  device_type: DeviceType;
  configuration: Record<string, any>;
  changed_by: string | null;
  change_reason: string | null;
  is_active: boolean;
  created_at: Date;
}

export class LogsService {
  private db: Pool;

  constructor(database: DatabaseService) {
    this.db = database.getPool();
  }

  /**
   * Create a device log entry
   */
  async createLog(logData: DeviceLogData): Promise<DeviceLog> {
    try {
      const result = await this.db.query(
        `INSERT INTO device_logs (
          device_id,
          device_type,
          log_level,
          event_type,
          message,
          details,
          timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          device_id,
          device_type,
          log_level,
          event_type,
          message,
          details,
          timestamp,
          created_at`,
        [
          logData.device_id,
          logData.device_type,
          logData.log_level,
          logData.event_type,
          logData.message,
          logData.details ? JSON.stringify(logData.details) : null,
          logData.timestamp || new Date(),
        ]
      );

      logger.debug('Device log created', {
        deviceId: logData.device_id,
        level: logData.log_level,
        event: logData.event_type,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create device log', { error, logData });
      throw new Error('Failed to create device log');
    }
  }

  /**
   * Get device logs with filters
   */
  async getLogs(query: LogQuery): Promise<DeviceLog[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (query.device_id) {
        conditions.push(`device_id = $${paramIndex++}`);
        params.push(query.device_id);
      }

      if (query.device_type) {
        conditions.push(`device_type = $${paramIndex++}`);
        params.push(query.device_type);
      }

      if (query.log_level) {
        conditions.push(`log_level = $${paramIndex++}`);
        params.push(query.log_level);
      }

      if (query.event_type) {
        conditions.push(`event_type = $${paramIndex++}`);
        params.push(query.event_type);
      }

      if (query.start_time) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(query.start_time);
      }

      if (query.end_time) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(query.end_time);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = query.limit || 1000;

      const sql = `
        SELECT
          id,
          device_id,
          device_type,
          log_level,
          event_type,
          message,
          details,
          timestamp,
          created_at
        FROM device_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get device logs', { error, query });
      throw new Error('Failed to get device logs');
    }
  }

  /**
   * Get error logs for a device
   */
  async getErrorLogs(deviceId: string, limit: number = 100): Promise<DeviceLog[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          device_id,
          device_type,
          log_level,
          event_type,
          message,
          details,
          timestamp,
          created_at
        FROM device_logs
        WHERE device_id = $1 AND log_level IN ('error', 'critical')
        ORDER BY timestamp DESC
        LIMIT $2`,
        [deviceId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get error logs', { error, deviceId });
      throw new Error('Failed to get error logs');
    }
  }

  /**
   * Get recent logs (last 24 hours)
   */
  async getRecentLogs(deviceId: string, limit: number = 100): Promise<DeviceLog[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          device_id,
          device_type,
          log_level,
          event_type,
          message,
          details,
          timestamp,
          created_at
        FROM device_logs
        WHERE device_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC
        LIMIT $2`,
        [deviceId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get recent logs', { error, deviceId });
      throw new Error('Failed to get recent logs');
    }
  }

  /**
   * Get log statistics for a device
   */
  async getLogStats(deviceId: string): Promise<any> {
    try {
      const result = await this.db.query(
        `SELECT
          log_level,
          COUNT(*) as count,
          MIN(timestamp) as first_occurrence,
          MAX(timestamp) as last_occurrence
        FROM device_logs
        WHERE device_id = $1
        GROUP BY log_level
        ORDER BY
          CASE log_level
            WHEN 'critical' THEN 1
            WHEN 'error' THEN 2
            WHEN 'warning' THEN 3
            WHEN 'info' THEN 4
            WHEN 'debug' THEN 5
          END`,
        [deviceId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get log stats', { error, deviceId });
      throw new Error('Failed to get log stats');
    }
  }

  /**
   * Delete old logs
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<number> {
    try {
      const result = await this.db.query(
        'SELECT cleanup_old_logs($1)',
        [retentionDays]
      );

      const deletedCount = result.rows[0].cleanup_old_logs;
      logger.info('Old logs cleaned up', { deletedCount, retentionDays });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old logs', { error });
      throw new Error('Failed to cleanup old logs');
    }
  }

  // =============================================
  // DEVICE CONFIGURATION MANAGEMENT
  // =============================================

  /**
   * Save device configuration
   */
  async saveConfiguration(
    deviceId: string,
    deviceType: DeviceType,
    configuration: Record<string, any>,
    changedBy?: string,
    changeReason?: string
  ): Promise<DeviceConfiguration> {
    try {
      const result = await this.db.query(
        `INSERT INTO device_configurations (
          device_id,
          device_type,
          configuration,
          changed_by,
          change_reason,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING
          id,
          device_id,
          device_type,
          configuration,
          changed_by,
          change_reason,
          is_active,
          created_at`,
        [
          deviceId,
          deviceType,
          JSON.stringify(configuration),
          changedBy || null,
          changeReason || null,
        ]
      );

      logger.info('Device configuration saved', { deviceId, changedBy });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to save device configuration', { error, deviceId });
      throw new Error('Failed to save device configuration');
    }
  }

  /**
   * Get active configuration for a device
   */
  async getActiveConfiguration(deviceId: string): Promise<DeviceConfiguration | null> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          device_id,
          device_type,
          configuration,
          changed_by,
          change_reason,
          is_active,
          created_at
        FROM device_configurations
        WHERE device_id = $1 AND is_active = TRUE
        ORDER BY created_at DESC
        LIMIT 1`,
        [deviceId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get active configuration', { error, deviceId });
      throw new Error('Failed to get active configuration');
    }
  }

  /**
   * Get configuration history for a device
   */
  async getConfigurationHistory(deviceId: string, limit: number = 50): Promise<DeviceConfiguration[]> {
    try {
      const result = await this.db.query(
        `SELECT
          id,
          device_id,
          device_type,
          configuration,
          changed_by,
          change_reason,
          is_active,
          created_at
        FROM device_configurations
        WHERE device_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
        [deviceId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get configuration history', { error, deviceId });
      throw new Error('Failed to get configuration history');
    }
  }

  /**
   * Revert to a previous configuration
   */
  async revertToConfiguration(configId: string, changedBy?: string): Promise<DeviceConfiguration> {
    try {
      // Get the configuration to revert to
      const config = await this.db.query(
        'SELECT device_id, device_type, configuration FROM device_configurations WHERE id = $1',
        [configId]
      );

      if (config.rows.length === 0) {
        throw new Error('Configuration not found');
      }

      const { device_id, device_type, configuration } = config.rows[0];

      // Save as new active configuration
      return await this.saveConfiguration(
        device_id,
        device_type,
        configuration,
        changedBy,
        `Reverted to configuration ${configId}`
      );
    } catch (error) {
      logger.error('Failed to revert configuration', { error, configId });
      throw error;
    }
  }
}
