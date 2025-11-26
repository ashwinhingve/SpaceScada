/**
 * Telemetry Service
 * Handles time-series telemetry data storage and retrieval for all device types
 */

import { Pool } from 'pg';
import { DatabaseService } from './database';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'TelemetryService' });

export type DeviceType = 'lorawan' | 'gsm' | 'wifi' | 'bluetooth';

export interface TelemetryData {
  device_id: string;
  device_type: DeviceType;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface TelemetryQuery {
  device_id: string;
  device_type: DeviceType;
  metric_name?: string;
  start_time?: Date;
  end_time?: Date;
  limit?: number;
  aggregation?: 'none' | 'hourly' | 'daily';
}

export interface TelemetryRecord {
  id: string;
  device_id: string;
  device_type: DeviceType;
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  metadata: Record<string, any> | null;
  timestamp: Date;
  created_at: Date;
}

export interface AggregatedTelemetry {
  metric_name: string;
  avg_value: number;
  min_value: number;
  max_value: number;
  sample_count: number;
  metric_unit: string | null;
  period: Date;
}

export class TelemetryService {
  private db: Pool;

  constructor(database: DatabaseService) {
    this.db = database.getPool();
  }

  /**
   * Record telemetry data point
   */
  async recordTelemetry(data: TelemetryData): Promise<TelemetryRecord> {
    try {
      const result = await this.db.query(
        `INSERT INTO device_telemetry (
          device_id,
          device_type,
          metric_name,
          metric_value,
          metric_unit,
          metadata,
          timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          device_id,
          device_type,
          metric_name,
          metric_value,
          metric_unit,
          metadata,
          timestamp,
          created_at`,
        [
          data.device_id,
          data.device_type,
          data.metric_name,
          data.metric_value,
          data.metric_unit || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
          data.timestamp || new Date(),
        ]
      );

      logger.debug('Telemetry recorded', {
        deviceId: data.device_id,
        metric: data.metric_name,
        value: data.metric_value,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to record telemetry', { error, data });
      throw new Error('Failed to record telemetry');
    }
  }

  /**
   * Record multiple telemetry data points in batch
   */
  async recordTelemetryBatch(dataPoints: TelemetryData[]): Promise<number> {
    if (dataPoints.length === 0) return 0;

    try {
      const values: any[] = [];
      const placeholders: string[] = [];

      dataPoints.forEach((data, index) => {
        const offset = index * 7;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
        );
        values.push(
          data.device_id,
          data.device_type,
          data.metric_name,
          data.metric_value,
          data.metric_unit || null,
          data.metadata ? JSON.stringify(data.metadata) : null,
          data.timestamp || new Date()
        );
      });

      const query = `
        INSERT INTO device_telemetry (
          device_id,
          device_type,
          metric_name,
          metric_value,
          metric_unit,
          metadata,
          timestamp
        ) VALUES ${placeholders.join(', ')}
      `;

      const result = await this.db.query(query, values);

      logger.info('Telemetry batch recorded', { count: dataPoints.length });

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to record telemetry batch', { error });
      throw new Error('Failed to record telemetry batch');
    }
  }

  /**
   * Get telemetry data for a device
   */
  async getTelemetry(query: TelemetryQuery): Promise<TelemetryRecord[]> {
    try {
      const conditions: string[] = [
        'device_id = $1',
        'device_type = $2',
      ];
      const params: any[] = [query.device_id, query.device_type];
      let paramIndex = 3;

      if (query.metric_name) {
        conditions.push(`metric_name = $${paramIndex++}`);
        params.push(query.metric_name);
      }

      if (query.start_time) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(query.start_time);
      }

      if (query.end_time) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(query.end_time);
      }

      const limit = query.limit || 1000;

      const sql = `
        SELECT
          id,
          device_id,
          device_type,
          metric_name,
          metric_value,
          metric_unit,
          metadata,
          timestamp,
          created_at
        FROM device_telemetry
        WHERE ${conditions.join(' AND ')}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get telemetry', { error, query });
      throw new Error('Failed to get telemetry');
    }
  }

  /**
   * Get aggregated telemetry data (hourly or daily averages)
   */
  async getAggregatedTelemetry(query: TelemetryQuery): Promise<AggregatedTelemetry[]> {
    try {
      const aggregation = query.aggregation || 'hourly';
      const truncFunc = aggregation === 'daily' ? 'day' : 'hour';

      const conditions: string[] = [
        'device_id = $1',
        'device_type = $2',
      ];
      const params: any[] = [query.device_id, query.device_type];
      let paramIndex = 3;

      if (query.metric_name) {
        conditions.push(`metric_name = $${paramIndex++}`);
        params.push(query.metric_name);
      }

      if (query.start_time) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(query.start_time);
      }

      if (query.end_time) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(query.end_time);
      }

      const sql = `
        SELECT
          metric_name,
          AVG(metric_value) as avg_value,
          MIN(metric_value) as min_value,
          MAX(metric_value) as max_value,
          COUNT(*) as sample_count,
          metric_unit,
          date_trunc('${truncFunc}', timestamp) as period
        FROM device_telemetry
        WHERE ${conditions.join(' AND ')}
        GROUP BY metric_name, metric_unit, date_trunc('${truncFunc}', timestamp)
        ORDER BY period DESC
        LIMIT ${query.limit || 1000}
      `;

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get aggregated telemetry', { error, query });
      throw new Error('Failed to get aggregated telemetry');
    }
  }

  /**
   * Get latest telemetry values for all metrics of a device
   */
  async getLatestTelemetry(deviceId: string, deviceType: DeviceType): Promise<Record<string, TelemetryRecord>> {
    try {
      const sql = `
        SELECT DISTINCT ON (metric_name)
          id,
          device_id,
          device_type,
          metric_name,
          metric_value,
          metric_unit,
          metadata,
          timestamp,
          created_at
        FROM device_telemetry
        WHERE device_id = $1 AND device_type = $2
        ORDER BY metric_name, timestamp DESC
      `;

      const result = await this.db.query(sql, [deviceId, deviceType]);

      // Convert array to object with metric_name as key
      const latest: Record<string, TelemetryRecord> = {};
      result.rows.forEach((row) => {
        latest[row.metric_name] = row;
      });

      return latest;
    } catch (error) {
      logger.error('Failed to get latest telemetry', { error, deviceId, deviceType });
      throw new Error('Failed to get latest telemetry');
    }
  }

  /**
   * Delete old telemetry data
   */
  async cleanupOldTelemetry(retentionDays: number = 90): Promise<number> {
    try {
      const result = await this.db.query(
        'SELECT cleanup_old_telemetry($1)',
        [retentionDays]
      );

      const deletedCount = result.rows[0].cleanup_old_telemetry;
      logger.info('Old telemetry cleaned up', { deletedCount, retentionDays });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old telemetry', { error });
      throw new Error('Failed to cleanup old telemetry');
    }
  }

  /**
   * Get telemetry statistics for a device
   */
  async getTelemetryStats(deviceId: string, deviceType: DeviceType, metricName?: string): Promise<any> {
    try {
      const conditions = ['device_id = $1', 'device_type = $2'];
      const params: any[] = [deviceId, deviceType];

      if (metricName) {
        conditions.push('metric_name = $3');
        params.push(metricName);
      }

      const sql = `
        SELECT
          metric_name,
          COUNT(*) as total_samples,
          AVG(metric_value) as avg_value,
          MIN(metric_value) as min_value,
          MAX(metric_value) as max_value,
          STDDEV(metric_value) as stddev_value,
          MIN(timestamp) as first_timestamp,
          MAX(timestamp) as last_timestamp,
          metric_unit
        FROM device_telemetry
        WHERE ${conditions.join(' AND ')}
        GROUP BY metric_name, metric_unit
        ORDER BY metric_name
      `;

      const result = await this.db.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get telemetry stats', { error });
      throw new Error('Failed to get telemetry stats');
    }
  }
}
