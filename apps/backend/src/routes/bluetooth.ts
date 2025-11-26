/**
 * Bluetooth Device Routes
 * REST API endpoints for managing Bluetooth and BLE devices
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BluetoothService, BluetoothDeviceData, BluetoothDeviceUpdateData } from '../services/bluetooth.service';
import { TelemetryService } from '../services/telemetry.service';
import { LogsService } from '../services/logs.service';

interface CreateBluetoothDeviceBody {
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

interface UpdateBluetoothDeviceBody {
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

/**
 * Register Bluetooth device routes
 */
export async function bluetoothRoutes(fastify: FastifyInstance) {
  const bluetoothService: BluetoothService = (fastify as any).bluetoothService;
  const telemetryService: TelemetryService = (fastify as any).telemetryService;
  const logsService: LogsService = (fastify as any).logsService;

  if (!bluetoothService) {
    throw new Error('BluetoothService not initialized');
  }

  if (!telemetryService) {
    throw new Error('TelemetryService not initialized');
  }

  if (!logsService) {
    throw new Error('LogsService not initialized');
  }

  // =============================================
  // DEVICE MANAGEMENT
  // =============================================

  /**
   * List all Bluetooth devices
   * GET /api/bluetooth
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { applicationId } = request.query as any;
      const devices = await bluetoothService.listDevices(applicationId);

      return reply.code(200).send({
        success: true,
        data: devices,
        total: devices.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to list Bluetooth devices',
        message: error.message,
      });
    }
  });

  /**
   * Get a single Bluetooth device by ID
   * GET /api/bluetooth/:id
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const device = await bluetoothService.getDevice(id);

      return reply.code(200).send({
        success: true,
        data: device,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: 'Bluetooth device not found',
        message: error.message,
      });
    }
  });

  /**
   * Create a new Bluetooth device
   * POST /api/bluetooth
   */
  fastify.post('/', async (request: FastifyRequest<{ Body: CreateBluetoothDeviceBody }>, reply: FastifyReply) => {
    try {
      const deviceData: BluetoothDeviceData = request.body;

      // Validate required fields
      if (!deviceData.name || !deviceData.mac_address || !deviceData.application_id) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields',
          message: 'name, mac_address, and application_id are required',
        });
      }

      const device = await bluetoothService.createDevice(deviceData);

      return reply.code(201).send({
        success: true,
        data: device,
        message: 'Bluetooth device created successfully',
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return reply.code(409).send({
          success: false,
          error: 'Conflict',
          message: error.message,
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Failed to create Bluetooth device',
        message: error.message,
      });
    }
  });

  /**
   * Update a Bluetooth device
   * PUT /api/bluetooth/:id
   */
  fastify.put('/:id', async (request: FastifyRequest<{ Body: UpdateBluetoothDeviceBody }>, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData: BluetoothDeviceUpdateData = request.body;

      const device = await bluetoothService.updateDevice(id, updateData);

      return reply.code(200).send({
        success: true,
        data: device,
        message: 'Bluetooth device updated successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Bluetooth device not found',
          message: error.message,
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Failed to update Bluetooth device',
        message: error.message,
      });
    }
  });

  /**
   * Delete a Bluetooth device
   * DELETE /api/bluetooth/:id
   */
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await bluetoothService.deleteDevice(id);

      return reply.code(200).send({
        success: true,
        message: 'Bluetooth device deleted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Bluetooth device not found',
          message: error.message,
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete Bluetooth device',
        message: error.message,
      });
    }
  });

  // =============================================
  // STATUS & MONITORING
  // =============================================

  /**
   * Update device status
   * PATCH /api/bluetooth/:id/status
   */
  fastify.patch('/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: 'online' | 'offline' | 'error' };

      if (!status) {
        return reply.code(400).send({
          success: false,
          error: 'Missing status field',
        });
      }

      await bluetoothService.updateStatus(id, status);

      return reply.code(200).send({
        success: true,
        message: 'Device status updated successfully',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update device status',
        message: error.message,
      });
    }
  });

  /**
   * Update battery level
   * PATCH /api/bluetooth/:id/battery
   */
  fastify.patch('/:id/battery', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { battery_level } = request.body as { battery_level: number };

      if (battery_level === undefined) {
        return reply.code(400).send({
          success: false,
          error: 'Missing battery_level field',
        });
      }

      await bluetoothService.updateBatteryLevel(id, battery_level);

      return reply.code(200).send({
        success: true,
        message: 'Battery level updated successfully',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update battery level',
        message: error.message,
      });
    }
  });

  /**
   * Update signal strength
   * PATCH /api/bluetooth/:id/signal
   */
  fastify.patch('/:id/signal', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { signal_strength } = request.body as { signal_strength: number };

      if (signal_strength === undefined) {
        return reply.code(400).send({
          success: false,
          error: 'Missing signal_strength field',
        });
      }

      await bluetoothService.updateSignalStrength(id, signal_strength);

      return reply.code(200).send({
        success: true,
        message: 'Signal strength updated successfully',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update signal strength',
        message: error.message,
      });
    }
  });

  /**
   * Get devices by status
   * GET /api/bluetooth/status/:status
   */
  fastify.get('/status/:status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { status } = request.params as { status: 'online' | 'offline' | 'error' };
      const devices = await bluetoothService.getDevicesByStatus(status);

      return reply.code(200).send({
        success: true,
        data: devices,
        total: devices.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get devices by status',
        message: error.message,
      });
    }
  });

  /**
   * Get devices by protocol
   * GET /api/bluetooth/protocol/:protocol
   */
  fastify.get('/protocol/:protocol', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { protocol } = request.params as { protocol: 'BLE' | 'Classic' };
      const devices = await bluetoothService.getDevicesByProtocol(protocol);

      return reply.code(200).send({
        success: true,
        data: devices,
        total: devices.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get devices by protocol',
        message: error.message,
      });
    }
  });

  /**
   * Get devices with low battery
   * GET /api/bluetooth/low-battery
   */
  fastify.get('/low-battery', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { threshold = 30 } = request.query as { threshold?: number };
      const devices = await bluetoothService.getDevicesWithLowBattery(Number(threshold));

      return reply.code(200).send({
        success: true,
        data: devices,
        total: devices.length,
        threshold: Number(threshold),
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get devices with low battery',
        message: error.message,
      });
    }
  });

  /**
   * Get device proximity information
   * GET /api/bluetooth/:id/proximity
   */
  fastify.get('/:id/proximity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const device = await bluetoothService.getDevice(id);

      // Calculate proximity based on signal strength (simplified)
      let proximity_zone: 'immediate' | 'near' | 'far' | 'unknown' = 'unknown';
      let distance_estimate = null;

      if (device.signal_strength) {
        if (device.signal_strength >= 90) {
          proximity_zone = 'immediate';
          distance_estimate = 0.5; // meters
        } else if (device.signal_strength >= 70) {
          proximity_zone = 'near';
          distance_estimate = 2; // meters
        } else if (device.signal_strength >= 40) {
          proximity_zone = 'far';
          distance_estimate = 10; // meters
        } else {
          proximity_zone = 'far';
          distance_estimate = 20; // meters
        }
      }

      const proximity = {
        device_id: device.id,
        name: device.name,
        signal_strength: device.signal_strength,
        proximity_zone,
        distance_estimate,
        last_seen: device.last_seen,
      };

      return reply.code(200).send({
        success: true,
        data: proximity,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: 'Failed to get device proximity',
        message: error.message,
      });
    }
  });

  // =============================================
  // TELEMETRY ENDPOINTS
  // =============================================

  /**
   * Get device telemetry
   * GET /api/bluetooth/:id/telemetry
   */
  fastify.get('/:id/telemetry', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const {
        metric_name,
        start_time,
        end_time,
        limit,
        aggregation,
      } = request.query as any;

      const query: any = {
        device_id: id,
        device_type: 'bluetooth',
        metric_name,
        limit: limit ? parseInt(limit) : 1000,
      };

      if (start_time) query.start_time = new Date(start_time);
      if (end_time) query.end_time = new Date(end_time);

      let telemetry;
      if (aggregation === 'hourly' || aggregation === 'daily') {
        query.aggregation = aggregation;
        telemetry = await telemetryService.getAggregatedTelemetry(query);
      } else {
        telemetry = await telemetryService.getTelemetry(query);
      }

      return reply.code(200).send({
        success: true,
        data: telemetry,
        total: telemetry.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get device telemetry',
        message: error.message,
      });
    }
  });

  /**
   * Get latest telemetry for device
   * GET /api/bluetooth/:id/telemetry/latest
   */
  fastify.get('/:id/telemetry/latest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const latest = await telemetryService.getLatestTelemetry(id, 'bluetooth');

      return reply.code(200).send({
        success: true,
        data: latest,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get latest telemetry',
        message: error.message,
      });
    }
  });

  /**
   * Record telemetry data point
   * POST /api/bluetooth/:id/telemetry
   */
  fastify.post('/:id/telemetry', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { metric_name, metric_value, metric_unit, metadata, timestamp } = request.body as any;

      if (!metric_name || metric_value === undefined) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: metric_name, metric_value',
        });
      }

      const telemetry = await telemetryService.recordTelemetry({
        device_id: id,
        device_type: 'bluetooth',
        metric_name,
        metric_value: parseFloat(metric_value),
        metric_unit,
        metadata,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });

      return reply.code(201).send({
        success: true,
        data: telemetry,
        message: 'Telemetry recorded successfully',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to record telemetry',
        message: error.message,
      });
    }
  });

  /**
   * Get telemetry statistics
   * GET /api/bluetooth/:id/telemetry/stats
   */
  fastify.get('/:id/telemetry/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { metric_name } = request.query as any;

      const stats = await telemetryService.getTelemetryStats(id, 'bluetooth', metric_name);

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get telemetry statistics',
        message: error.message,
      });
    }
  });

  // =============================================
  // LOGS ENDPOINTS
  // =============================================

  /**
   * Get device logs
   * GET /api/bluetooth/:id/logs
   */
  fastify.get('/:id/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const {
        log_level,
        event_type,
        start_time,
        end_time,
        limit,
      } = request.query as any;

      const query: any = {
        device_id: id,
        device_type: 'bluetooth',
        log_level,
        event_type,
        limit: limit ? parseInt(limit) : 1000,
      };

      if (start_time) query.start_time = new Date(start_time);
      if (end_time) query.end_time = new Date(end_time);

      const logs = await logsService.getLogs(query);

      return reply.code(200).send({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get device logs',
        message: error.message,
      });
    }
  });

  /**
   * Get device error logs
   * GET /api/bluetooth/:id/logs/errors
   */
  fastify.get('/:id/logs/errors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { limit } = request.query as any;

      const logs = await logsService.getErrorLogs(id, limit ? parseInt(limit) : 100);

      return reply.code(200).send({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get error logs',
        message: error.message,
      });
    }
  });

  /**
   * Get recent device logs
   * GET /api/bluetooth/:id/logs/recent
   */
  fastify.get('/:id/logs/recent', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { limit } = request.query as any;

      const logs = await logsService.getRecentLogs(id, limit ? parseInt(limit) : 100);

      return reply.code(200).send({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get recent logs',
        message: error.message,
      });
    }
  });

  /**
   * Create device log entry
   * POST /api/bluetooth/:id/logs
   */
  fastify.post('/:id/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { log_level, event_type, message, details, timestamp } = request.body as any;

      if (!log_level || !event_type || !message) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: log_level, event_type, message',
        });
      }

      const log = await logsService.createLog({
        device_id: id,
        device_type: 'bluetooth',
        log_level,
        event_type,
        message,
        details,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });

      return reply.code(201).send({
        success: true,
        data: log,
        message: 'Log entry created successfully',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to create log entry',
        message: error.message,
      });
    }
  });

  /**
   * Get log statistics
   * GET /api/bluetooth/:id/logs/stats
   */
  fastify.get('/:id/logs/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const stats = await logsService.getLogStats(id);

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get log statistics',
        message: error.message,
      });
    }
  });

  // =============================================
  // CONFIGURATION ENDPOINTS
  // =============================================

  /**
   * Get active device configuration
   * GET /api/bluetooth/:id/configuration
   */
  fastify.get('/:id/configuration', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const config = await logsService.getActiveConfiguration(id);

      return reply.code(200).send({
        success: true,
        data: config,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get device configuration',
        message: error.message,
      });
    }
  });

  /**
   * Save device configuration
   * POST /api/bluetooth/:id/configuration
   */
  fastify.post('/:id/configuration', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { configuration, changed_by, change_reason } = request.body as any;

      if (!configuration) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required field: configuration',
        });
      }

      const config = await logsService.saveConfiguration(
        id,
        'bluetooth',
        configuration,
        changed_by,
        change_reason
      );

      return reply.code(201).send({
        success: true,
        data: config,
        message: 'Configuration saved successfully',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to save configuration',
        message: error.message,
      });
    }
  });

  /**
   * Get configuration history
   * GET /api/bluetooth/:id/configuration/history
   */
  fastify.get('/:id/configuration/history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { limit } = request.query as any;

      const history = await logsService.getConfigurationHistory(id, limit ? parseInt(limit) : 50);

      return reply.code(200).send({
        success: true,
        data: history,
        total: history.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get configuration history',
        message: error.message,
      });
    }
  });
}
