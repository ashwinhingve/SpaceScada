/**
 * Wi-Fi Device Routes
 * REST API endpoints for managing Wi-Fi devices
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WiFiService, WiFiDeviceData, WiFiDeviceUpdateData } from '../services/wifi.service';
import { TelemetryService } from '../services/telemetry.service';
import { LogsService } from '../services/logs.service';

interface CreateWiFiDeviceBody {
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

interface UpdateWiFiDeviceBody {
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

/**
 * Register Wi-Fi device routes
 */
export async function wifiRoutes(fastify: FastifyInstance) {
  const wifiService: WiFiService = (fastify as any).wifiService;
  const telemetryService: TelemetryService = (fastify as any).telemetryService;
  const logsService: LogsService = (fastify as any).logsService;

  if (!wifiService) {
    throw new Error('WiFiService not initialized');
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
   * List all Wi-Fi devices
   * GET /api/wifi
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { applicationId } = request.query as any;
      const devices = await wifiService.listDevices(applicationId);

      return reply.code(200).send({
        success: true,
        data: devices,
        total: devices.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to list Wi-Fi devices',
        message: error.message,
      });
    }
  });

  /**
   * Get a single Wi-Fi device by ID
   * GET /api/wifi/:id
   */
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const device = await wifiService.getDevice(id);

      return reply.code(200).send({
        success: true,
        data: device,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: 'Wi-Fi device not found',
        message: error.message,
      });
    }
  });

  /**
   * Create a new Wi-Fi device
   * POST /api/wifi
   */
  fastify.post('/', async (request: FastifyRequest<{ Body: CreateWiFiDeviceBody }>, reply: FastifyReply) => {
    try {
      const deviceData: WiFiDeviceData = request.body;

      // Validate required fields
      if (!deviceData.name || !deviceData.mac_address || !deviceData.application_id) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields',
          message: 'name, mac_address, and application_id are required',
        });
      }

      const device = await wifiService.createDevice(deviceData);

      return reply.code(201).send({
        success: true,
        data: device,
        message: 'Wi-Fi device created successfully',
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
        error: 'Failed to create Wi-Fi device',
        message: error.message,
      });
    }
  });

  /**
   * Update a Wi-Fi device
   * PUT /api/wifi/:id
   */
  fastify.put('/:id', async (request: FastifyRequest<{ Body: UpdateWiFiDeviceBody }>, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData: WiFiDeviceUpdateData = request.body;

      const device = await wifiService.updateDevice(id, updateData);

      return reply.code(200).send({
        success: true,
        data: device,
        message: 'Wi-Fi device updated successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Wi-Fi device not found',
          message: error.message,
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Failed to update Wi-Fi device',
        message: error.message,
      });
    }
  });

  /**
   * Delete a Wi-Fi device
   * DELETE /api/wifi/:id
   */
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await wifiService.deleteDevice(id);

      return reply.code(200).send({
        success: true,
        message: 'Wi-Fi device deleted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Wi-Fi device not found',
          message: error.message,
        });
      }
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete Wi-Fi device',
        message: error.message,
      });
    }
  });

  // =============================================
  // STATUS & MONITORING
  // =============================================

  /**
   * Update device status
   * PATCH /api/wifi/:id/status
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

      await wifiService.updateStatus(id, status);

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
   * Update signal strength
   * PATCH /api/wifi/:id/signal
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

      await wifiService.updateSignalStrength(id, signal_strength);

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
   * GET /api/wifi/status/:status
   */
  fastify.get('/status/:status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { status } = request.params as { status: 'online' | 'offline' | 'error' };
      const devices = await wifiService.getDevicesByStatus(status);

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
   * Get devices with weak signal
   * GET /api/wifi/weak-signal
   */
  fastify.get('/weak-signal', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { threshold = 50 } = request.query as { threshold?: number };
      const devices = await wifiService.getDevicesWithWeakSignal(Number(threshold));

      return reply.code(200).send({
        success: true,
        data: devices,
        total: devices.length,
        threshold: Number(threshold),
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to get devices with weak signal',
        message: error.message,
      });
    }
  });

  /**
   * Get device statistics
   * GET /api/wifi/:id/stats
   */
  fastify.get('/:id/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const device = await wifiService.getDevice(id);

      // Calculate basic statistics
      const stats = {
        device_id: device.id,
        name: device.name,
        status: device.status,
        signal_strength: device.signal_strength,
        signal_quality: device.signal_strength >= 80 ? 'excellent' :
                        device.signal_strength >= 50 ? 'good' :
                        device.signal_strength >= 30 ? 'fair' : 'poor',
        uptime_hours: device.last_seen ?
          Math.floor((Date.now() - new Date(device.last_seen).getTime()) / (1000 * 60 * 60)) :
          null,
        last_seen: device.last_seen,
      };

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: 'Failed to get device statistics',
        message: error.message,
      });
    }
  });

  // =============================================
  // TELEMETRY ENDPOINTS
  // =============================================

  /**
   * Get device telemetry
   * GET /api/wifi/:id/telemetry
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
        device_type: 'wifi',
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
   * GET /api/wifi/:id/telemetry/latest
   */
  fastify.get('/:id/telemetry/latest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const latest = await telemetryService.getLatestTelemetry(id, 'wifi');

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
   * POST /api/wifi/:id/telemetry
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
        device_type: 'wifi',
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
   * GET /api/wifi/:id/telemetry/stats
   */
  fastify.get('/:id/telemetry/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { metric_name } = request.query as any;

      const stats = await telemetryService.getTelemetryStats(id, 'wifi', metric_name);

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
   * GET /api/wifi/:id/logs
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
        device_type: 'wifi',
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
   * GET /api/wifi/:id/logs/errors
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
   * GET /api/wifi/:id/logs/recent
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
   * POST /api/wifi/:id/logs
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
        device_type: 'wifi',
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
   * GET /api/wifi/:id/logs/stats
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
   * GET /api/wifi/:id/configuration
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
   * POST /api/wifi/:id/configuration
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
        'wifi',
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
   * GET /api/wifi/:id/configuration/history
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
