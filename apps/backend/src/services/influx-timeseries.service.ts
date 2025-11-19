/**
 * InfluxDB Time-Series Service
 * Handles storage and retrieval of sensor data in InfluxDB
 */

import { InfluxDBClient, Point } from '@influxdata/influxdb3-client';
import { createLogger } from '@webscada/utils';

const logger = createLogger({ prefix: 'InfluxTimeSeriesService' });

interface DataPoint {
  measurement: string;
  tags: Record<string, string>;
  fields: Record<string, number | string | boolean>;
  timestamp?: Date;
}

interface QueryResult {
  timestamp: Date;
  value: number;
  [key: string]: any;
}

class InfluxTimeSeriesService {
  private client: InfluxDBClient | null = null;
  private database: string;
  private initialized = false;

  constructor() {
    this.database = process.env.INFLUX_BUCKET || 'webscada';
  }

  initialize(): void {
    if (this.initialized) return;

    const host = process.env.INFLUX_HOST || 'http://localhost:8086';
    const token = process.env.INFLUX_TOKEN;

    if (!token) {
      logger.warn('INFLUX_TOKEN not set, InfluxDB service will not be available');
      return;
    }

    try {
      this.client = new InfluxDBClient({
        host,
        token,
        database: this.database,
      });

      this.initialized = true;
      logger.info('InfluxDB client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize InfluxDB client:', error);
      throw error;
    }
  }

  async writePoint(
    measurement: string,
    tags: Record<string, string>,
    fields: Record<string, any>,
    timestamp?: Date
  ): Promise<void> {
    if (!this.client) {
      throw new Error('InfluxDB client not initialized');
    }

    try {
      const point = Point.measurement(measurement);

      // Add tags
      Object.entries(tags).forEach(([key, value]) => {
        point.setTag(key, value);
      });

      // Add fields
      Object.entries(fields).forEach(([key, value]) => {
        if (typeof value === 'number') {
          point.setFloatField(key, value);
        } else if (typeof value === 'boolean') {
          point.setBooleanField(key, value);
        } else {
          point.setStringField(key, String(value));
        }
      });

      // Set timestamp if provided
      if (timestamp) {
        point.setTimestamp(timestamp);
      }

      await this.client.write(point, this.database);
      logger.debug(`Wrote point to ${measurement}`);
    } catch (error) {
      logger.error('Error writing to InfluxDB:', error);
      throw error;
    }
  }

  async writeDataPoints(dataPoints: DataPoint[]): Promise<void> {
    if (!this.client) {
      throw new Error('InfluxDB client not initialized');
    }

    try {
      const points: Point[] = [];

      for (const dp of dataPoints) {
        const point = Point.measurement(dp.measurement);

        // Add tags
        Object.entries(dp.tags).forEach(([key, value]) => {
          point.setTag(key, value);
        });

        // Add fields
        Object.entries(dp.fields).forEach(([key, value]) => {
          if (typeof value === 'number') {
            point.setFloatField(key, value);
          } else if (typeof value === 'boolean') {
            point.setBooleanField(key, value);
          } else {
            point.setStringField(key, String(value));
          }
        });

        // Set timestamp if provided
        if (dp.timestamp) {
          point.setTimestamp(dp.timestamp);
        }

        points.push(point);
      }

      await this.client.write(points, this.database);
      logger.info(`Wrote ${points.length} data points to InfluxDB`);
    } catch (error) {
      logger.error('Error writing data points to InfluxDB:', error);
      throw error;
    }
  }

  async queryData(query: string): Promise<QueryResult[]> {
    if (!this.client) {
      throw new Error('InfluxDB client not initialized');
    }

    try {
      const result = await this.client.query(query, this.database);
      const data: QueryResult[] = [];

      for await (const row of result) {
        data.push(row as QueryResult);
      }

      return data;
    } catch (error) {
      logger.error('Error querying InfluxDB:', error);
      throw error;
    }
  }

  async queryPressureData(
    startTime: string,
    endTime: string,
    deviceId?: string
  ): Promise<QueryResult[]> {
    let query = `
      SELECT time, value
      FROM pressure
      WHERE time >= '${startTime}' AND time <= '${endTime}'
    `;

    if (deviceId) {
      query += ` AND device_id = '${deviceId}'`;
    }

    query += ` ORDER BY time ASC`;

    return this.queryData(query);
  }

  async queryFlowData(
    startTime: string,
    endTime: string,
    deviceId?: string
  ): Promise<QueryResult[]> {
    let query = `
      SELECT time, value
      FROM flow
      WHERE time >= '${startTime}' AND time <= '${endTime}'
    `;

    if (deviceId) {
      query += ` AND device_id = '${deviceId}'`;
    }

    query += ` ORDER BY time ASC`;

    return this.queryData(query);
  }

  async getLatestPressure(deviceId: string): Promise<QueryResult | null> {
    const query = `
      SELECT time, value
      FROM pressure
      WHERE device_id = '${deviceId}'
      ORDER BY time DESC
      LIMIT 1
    `;

    const results = await this.queryData(query);
    return results.length > 0 ? results[0] : null;
  }

  async getLatestFlow(deviceId: string): Promise<QueryResult | null> {
    const query = `
      SELECT time, value
      FROM flow
      WHERE device_id = '${deviceId}'
      ORDER BY time DESC
      LIMIT 1
    `;

    const results = await this.queryData(query);
    return results.length > 0 ? results[0] : null;
  }

  async aggregatePressureData(
    startTime: string,
    endTime: string,
    interval: string = '1h',
    deviceId?: string
  ): Promise<QueryResult[]> {
    let query = `
      SELECT
        date_bin('${interval}', time) AS time_bucket,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value
      FROM pressure
      WHERE time >= '${startTime}' AND time <= '${endTime}'
    `;

    if (deviceId) {
      query += ` AND device_id = '${deviceId}'`;
    }

    query += ` GROUP BY time_bucket ORDER BY time_bucket ASC`;

    return this.queryData(query);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  close(): void {
    if (this.client) {
      this.client.close();
      logger.info('InfluxDB client closed');
      this.initialized = false;
    }
  }
}

export const influxTimeSeriesService = new InfluxTimeSeriesService();
export default influxTimeSeriesService;
