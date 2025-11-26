/**
 * LoRaWAN Console API Routes
 * Provides REST API endpoints for managing LoRaWAN applications, gateways, and devices
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { chirpstackService } from '../services/chirpstack.service';
import { LogsService } from '../services/logs.service';
import { TelemetryService } from '../services/telemetry.service';

// Request body types
interface CreateApplicationBody {
  name: string;
  description?: string;
  tenantId?: string;
}

interface CreateGatewayBody {
  gatewayId: string;
  name: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  tenantId?: string;
}

interface CreateDeviceBody {
  devEui: string;
  name: string;
  description?: string;
  applicationId: string;
  deviceProfileId: string;
  activationMode: 'OTAA' | 'ABP';
  appKey?: string;
  nwkKey?: string;
  devAddr?: string;
  appSKey?: string;
  nwkSEncKey?: string;
}

interface SendDownlinkBody {
  data: string;
  fPort: number;
  confirmed?: boolean;
}

/**
 * Register LoRaWAN routes
 */
export async function lorawanRoutes(fastify: FastifyInstance) {
  // Initialize services
  const telemetryService: TelemetryService = (fastify as any).telemetryService;
  const logsService: LogsService = (fastify as any).logsService;

  if (!telemetryService) {
    throw new Error('TelemetryService not initialized');
  }

  if (!logsService) {
    throw new Error('LogsService not initialized');
  }

  // =============================================
  // APPLICATIONS
  // =============================================

  /**
   * List all applications
   */
  fastify.get('/api/lorawan/applications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = 100, offset = 0, tenantId } = request.query as any;
      const applications = await chirpstackService.listApplications(
        parseInt(limit),
        parseInt(offset),
        tenantId
      );
      return reply.code(200).send({
        success: true,
        data: applications,
        total: applications.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to list applications',
        message: error.message,
      });
    }
  });

  /**
   * Get application by ID
   */
  fastify.get(
    '/api/lorawan/applications/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const application = await chirpstackService.getApplication(id);
        return reply.code(200).send({
          success: true,
          data: application,
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: 'Application not found',
          message: error.message,
        });
      }
    }
  );

  /**
   * Create application
   */
  fastify.post(
    '/api/lorawan/applications',
    async (request: FastifyRequest<{ Body: CreateApplicationBody }>, reply: FastifyReply) => {
      try {
        const { name, description, tenantId } = request.body;
        const applicationId = await chirpstackService.createApplication({
          name,
          description,
          tenantId,
        });
        return reply.code(201).send({
          success: true,
          data: { id: applicationId },
          message: 'Application created successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to create application',
          message: error.message,
        });
      }
    }
  );

  /**
   * Update application
   */
  fastify.put(
    '/api/lorawan/applications/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { name, description, tenantId } = request.body as any;
        await chirpstackService.updateApplication({
          id,
          name,
          description,
          tenantId,
        });
        return reply.code(200).send({
          success: true,
          message: 'Application updated successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to update application',
          message: error.message,
        });
      }
    }
  );

  /**
   * Delete application
   */
  fastify.delete(
    '/api/lorawan/applications/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        await chirpstackService.deleteApplication(id);
        return reply.code(200).send({
          success: true,
          message: 'Application deleted successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete application',
          message: error.message,
        });
      }
    }
  );

  // =============================================
  // GATEWAYS
  // =============================================

  /**
   * List all gateways
   */
  fastify.get('/api/lorawan/gateways', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = 100, offset = 0, tenantId } = request.query as any;
      const gateways = await chirpstackService.listGateways(
        parseInt(limit),
        parseInt(offset),
        tenantId
      );
      return reply.code(200).send({
        success: true,
        data: gateways,
        total: gateways.length,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to list gateways',
        message: error.message,
      });
    }
  });

  /**
   * Get gateway by ID
   */
  fastify.get('/api/lorawan/gateways/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const gateway = await chirpstackService.getGateway(id);
      return reply.code(200).send({
        success: true,
        data: gateway,
      });
    } catch (error: any) {
      return reply.code(404).send({
        success: false,
        error: 'Gateway not found',
        message: error.message,
      });
    }
  });

  /**
   * Create gateway
   */
  fastify.post(
    '/api/lorawan/gateways',
    async (request: FastifyRequest<{ Body: CreateGatewayBody }>, reply: FastifyReply) => {
      try {
        const gateway = request.body;
        await chirpstackService.createGateway(gateway);
        return reply.code(201).send({
          success: true,
          message: 'Gateway created successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to create gateway',
          message: error.message,
        });
      }
    }
  );

  /**
   * Update gateway
   */
  fastify.put('/api/lorawan/gateways/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const gateway = request.body as any;
      await chirpstackService.updateGateway({
        ...gateway,
        gatewayId: id,
      });
      return reply.code(200).send({
        success: true,
        message: 'Gateway updated successfully',
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        error: 'Failed to update gateway',
        message: error.message,
      });
    }
  });

  /**
   * Delete gateway
   */
  fastify.delete(
    '/api/lorawan/gateways/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        await chirpstackService.deleteGateway(id);
        return reply.code(200).send({
          success: true,
          message: 'Gateway deleted successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete gateway',
          message: error.message,
        });
      }
    }
  );

  /**
   * Get gateway statistics
   */
  fastify.get(
    '/api/lorawan/gateways/:id/stats',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const { start, end } = request.query as any;
        const stats = await chirpstackService.getGatewayStats(
          id,
          new Date(start || Date.now() - 24 * 60 * 60 * 1000),
          new Date(end || Date.now())
        );
        return reply.code(200).send({
          success: true,
          data: stats,
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to get gateway stats',
          message: error.message,
        });
      }
    }
  );

  // =============================================
  // DEVICES
  // =============================================

  /**
   * List devices for an application
   */
  fastify.get(
    '/api/lorawan/applications/:applicationId/devices',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { applicationId } = request.params as { applicationId: string };
        const { limit = 100, offset = 0 } = request.query as any;
        const devices = await chirpstackService.listDevices(
          applicationId,
          parseInt(limit),
          parseInt(offset)
        );
        return reply.code(200).send({
          success: true,
          data: devices,
          total: devices.length,
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to list devices',
          message: error.message,
        });
      }
    }
  );

  /**
   * Get device by DevEUI
   */
  fastify.get(
    '/api/lorawan/devices/:devEui',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const device = await chirpstackService.getDevice(devEui);
        return reply.code(200).send({
          success: true,
          data: device,
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: 'Device not found',
          message: error.message,
        });
      }
    }
  );

  /**
   * Create device
   */
  fastify.post(
    '/api/lorawan/devices',
    async (request: FastifyRequest<{ Body: CreateDeviceBody }>, reply: FastifyReply) => {
      try {
        const { activationMode, appKey, nwkKey, devAddr, appSKey, nwkSEncKey, ...deviceData } =
          request.body;

        // Create device
        await chirpstackService.createDevice(deviceData);

        // Set up activation
        if (activationMode === 'OTAA') {
          if (appKey || nwkKey) {
            await chirpstackService.createDeviceKeys({
              devEui: deviceData.devEui,
              appKey,
              nwkKey,
            });
          }
        } else if (activationMode === 'ABP') {
          if (devAddr && appSKey && nwkSEncKey) {
            await chirpstackService.activateDevice({
              devEui: deviceData.devEui,
              devAddr,
              appSKey,
              nwkSEncKey: nwkSEncKey,
              fCntUp: 0,
              nFCntDown: 0,
              aFCntDown: 0,
            });
          }
        }

        return reply.code(201).send({
          success: true,
          message: 'Device created successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to create device',
          message: error.message,
        });
      }
    }
  );

  /**
   * Update device
   */
  fastify.put(
    '/api/lorawan/devices/:devEui',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const device = request.body as any;
        await chirpstackService.updateDevice({
          ...device,
          devEui,
        });
        return reply.code(200).send({
          success: true,
          message: 'Device updated successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to update device',
          message: error.message,
        });
      }
    }
  );

  /**
   * Delete device
   */
  fastify.delete(
    '/api/lorawan/devices/:devEui',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        await chirpstackService.deleteDevice(devEui);
        return reply.code(200).send({
          success: true,
          message: 'Device deleted successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to delete device',
          message: error.message,
        });
      }
    }
  );

  /**
   * Send downlink to device
   */
  fastify.post(
    '/api/lorawan/devices/:devEui/downlink',
    async (request: FastifyRequest<{ Body: SendDownlinkBody }>, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { data, fPort, confirmed = false } = request.body;
        await chirpstackService.sendDownlink(devEui, data, fPort, confirmed);
        return reply.code(200).send({
          success: true,
          message: 'Downlink queued successfully',
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to send downlink',
          message: error.message,
        });
      }
    }
  );

  /**
   * Get device metrics
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/metrics',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { start, end, aggregation = 'DAY' } = request.query as any;
        const metrics = await chirpstackService.getDeviceMetrics(
          devEui,
          new Date(start || Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date(end || Date.now()),
          aggregation
        );
        return reply.code(200).send({
          success: true,
          data: metrics,
        });
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: 'Failed to get device metrics',
          message: error.message,
        });
      }
    }
  );

  // =============================================
  // TELEMETRY ENDPOINTS
  // =============================================

  /**
   * Get device telemetry
   * GET /api/lorawan/devices/:devEui/telemetry
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/telemetry',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { metric_name, start_time, end_time, limit, aggregation } = request.query as any;

        const query: any = {
          device_id: devEui,
          device_type: 'lorawan',
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
    }
  );

  /**
   * Get latest telemetry for device
   * GET /api/lorawan/devices/:devEui/telemetry/latest
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/telemetry/latest',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const latest = await telemetryService.getLatestTelemetry(devEui, 'lorawan');

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
    }
  );

  /**
   * Record telemetry data point
   * POST /api/lorawan/devices/:devEui/telemetry
   */
  fastify.post(
    '/api/lorawan/devices/:devEui/telemetry',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { metric_name, metric_value, metric_unit, metadata, timestamp } = request.body as any;

        if (!metric_name || metric_value === undefined) {
          return reply.code(400).send({
            success: false,
            error: 'Missing required fields: metric_name, metric_value',
          });
        }

        const telemetry = await telemetryService.recordTelemetry({
          device_id: devEui,
          device_type: 'lorawan',
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
    }
  );

  /**
   * Get telemetry statistics
   * GET /api/lorawan/devices/:devEui/telemetry/stats
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/telemetry/stats',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { metric_name } = request.query as any;

        const stats = await telemetryService.getTelemetryStats(devEui, 'lorawan', metric_name);

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
    }
  );

  // =============================================
  // LOGS ENDPOINTS
  // =============================================

  /**
   * Get device logs
   * GET /api/lorawan/devices/:devEui/logs
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/logs',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { log_level, event_type, start_time, end_time, limit } = request.query as any;

        const query: any = {
          device_id: devEui,
          device_type: 'lorawan',
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
    }
  );

  /**
   * Get device error logs
   * GET /api/lorawan/devices/:devEui/logs/errors
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/logs/errors',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { limit } = request.query as any;

        const logs = await logsService.getErrorLogs(devEui, limit ? parseInt(limit) : 100);

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
    }
  );

  /**
   * Get recent device logs
   * GET /api/lorawan/devices/:devEui/logs/recent
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/logs/recent',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { limit } = request.query as any;

        const logs = await logsService.getRecentLogs(devEui, limit ? parseInt(limit) : 100);

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
    }
  );

  /**
   * Create device log entry
   * POST /api/lorawan/devices/:devEui/logs
   */
  fastify.post(
    '/api/lorawan/devices/:devEui/logs',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { log_level, event_type, message, details, timestamp } = request.body as any;

        if (!log_level || !event_type || !message) {
          return reply.code(400).send({
            success: false,
            error: 'Missing required fields: log_level, event_type, message',
          });
        }

        const log = await logsService.createLog({
          device_id: devEui,
          device_type: 'lorawan',
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
    }
  );

  /**
   * Get log statistics
   * GET /api/lorawan/devices/:devEui/logs/stats
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/logs/stats',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const stats = await logsService.getLogStats(devEui);

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
    }
  );

  // =============================================
  // CONFIGURATION ENDPOINTS
  // =============================================

  /**
   * Get active device configuration
   * GET /api/lorawan/devices/:devEui/configuration
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/configuration',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const config = await logsService.getActiveConfiguration(devEui);

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
    }
  );

  /**
   * Save device configuration
   * POST /api/lorawan/devices/:devEui/configuration
   */
  fastify.post(
    '/api/lorawan/devices/:devEui/configuration',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { configuration, changed_by, change_reason } = request.body as any;

        if (!configuration) {
          return reply.code(400).send({
            success: false,
            error: 'Missing required field: configuration',
          });
        }

        const config = await logsService.saveConfiguration(
          devEui,
          'lorawan',
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
    }
  );

  /**
   * Get configuration history
   * GET /api/lorawan/devices/:devEui/configuration/history
   */
  fastify.get(
    '/api/lorawan/devices/:devEui/configuration/history',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { devEui } = request.params as { devEui: string };
        const { limit } = request.query as any;

        const history = await logsService.getConfigurationHistory(
          devEui,
          limit ? parseInt(limit) : 50
        );

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
    }
  );
}
