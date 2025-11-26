import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  GSMDevice,
  ApiResponse,
  SendSMSRequest,
  SendSMSResponse,
  SMSMessage,
  GPSLocation,
  GSMNetworkStatus,
  GSMCommand,
  SMSDirection,
  SMSStatus,
} from '@webscada/shared-types';
import { GSMService } from '../services/gsm.service';
import { TelemetryService } from '../services/telemetry.service';
import { LogsService } from '../services/logs.service';

/**
 * GSM Device Routes
 * Handles all GSM device operations including SMS, GPS, and network monitoring
 */
export const gsmRoutes = async (server: FastifyInstance) => {
  // Initialize services
  const gsmService = (server as any).gsmService as GSMService;
  const telemetryService: TelemetryService = (server as any).telemetryService;
  const logsService: LogsService = (server as any).logsService;

  if (!gsmService) {
    throw new Error('GSM Service not initialized');
  }

  if (!telemetryService) {
    throw new Error('TelemetryService not initialized');
  }

  if (!logsService) {
    throw new Error('LogsService not initialized');
  }

  // GET /api/gsm - List all GSM devices
  server.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const devices = await gsmService.listDevices();

      const response: ApiResponse<GSMDevice[]> = {
        success: true,
        data: devices,
        timestamp: new Date(),
      };
      return reply.send(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message,
        },
        timestamp: new Date(),
      };
      return reply.status(500).send(response);
    }
  });

  // POST /api/gsm - Register new GSM device
  server.post<{ Body: GSMDevice }>(
    '/',
    async (request: FastifyRequest<{ Body: GSMDevice }>, reply: FastifyReply) => {
      try {
        const device = await gsmService.registerDevice(request.body);

        const response: ApiResponse<GSMDevice> = {
          success: true,
          data: device,
          timestamp: new Date(),
        };
        return reply.status(201).send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // GET /api/gsm/:id - Get GSM device details
  server.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const device = await gsmService.getDevice(request.params.id);

        if (!device) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `GSM device ${request.params.id} not found`,
            },
            timestamp: new Date(),
          };
          return reply.status(404).send(response);
        }

        const response: ApiResponse<GSMDevice> = {
          success: true,
          data: device,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // DELETE /api/gsm/:id - Unregister GSM device
  server.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await gsmService.unregisterDevice(request.params.id);

        const response: ApiResponse = {
          success: true,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'UNREGISTER_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // POST /api/gsm/:id/sms/send - Send SMS message
  server.post<{ Params: { id: string }; Body: SendSMSRequest }>(
    '/:id/sms/send',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: SendSMSRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const response = await gsmService.sendSMS(request.params.id, request.body);

        const apiResponse: ApiResponse<SendSMSResponse> = {
          success: true,
          data: response,
          timestamp: new Date(),
        };
        return reply.send(apiResponse);
      } catch (error) {
        const apiResponse: ApiResponse = {
          success: false,
          error: {
            code: 'SMS_SEND_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(apiResponse);
      }
    }
  );

  // GET /api/gsm/:id/sms - Get SMS messages
  server.get<{
    Params: { id: string };
    Querystring: { direction?: SMSDirection; status?: SMSStatus; limit?: string };
  }>(
    '/:id/sms',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { direction?: SMSDirection; status?: SMSStatus; limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const filter = {
          direction: request.query.direction,
          status: request.query.status,
          limit: request.query.limit ? parseInt(request.query.limit) : 100,
        };

        const messages = await gsmService.getSMSMessages(request.params.id, filter);

        const response: ApiResponse<SMSMessage[]> = {
          success: true,
          data: messages,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'SMS_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // POST /api/gsm/:id/sms/sync - Sync SMS messages from device
  server.post<{ Params: { id: string } }>(
    '/:id/sms/sync',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const messages = await gsmService.syncSMS(request.params.id);

        const response: ApiResponse<SMSMessage[]> = {
          success: true,
          data: messages,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'SMS_SYNC_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // GET /api/gsm/:id/gps - Get current GPS location
  server.get<{ Params: { id: string } }>(
    '/:id/gps',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const location = await gsmService.getGPSLocation(request.params.id);

        const response: ApiResponse<GPSLocation> = {
          success: true,
          data: location,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'GPS_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // GET /api/gsm/:id/gps/history - Get GPS location history
  server.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/:id/gps/history',
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const limit = request.query.limit ? parseInt(request.query.limit) : 100;
        const locations = await gsmService.getLocationHistory(request.params.id, limit);

        const response: ApiResponse<GPSLocation[]> = {
          success: true,
          data: locations,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'GPS_HISTORY_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // GET /api/gsm/:id/network - Get network status
  server.get<{ Params: { id: string } }>(
    '/:id/network',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const status = await gsmService.getNetworkStatus(request.params.id);

        const response: ApiResponse<GSMNetworkStatus> = {
          success: true,
          data: status,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NETWORK_STATUS_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // GET /api/gsm/:id/network/history - Get network status history
  server.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/:id/network/history',
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const limit = request.query.limit ? parseInt(request.query.limit) : 100;
        const history = await gsmService.getNetworkStatusHistory(request.params.id, limit);

        const response: ApiResponse<GSMNetworkStatus[]> = {
          success: true,
          data: history,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'NETWORK_HISTORY_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // POST /api/gsm/:id/commands - Send AT command
  server.post<{ Params: { id: string }; Body: { command: string; data?: string } }>(
    '/:id/commands',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { command: string; data?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const cmd = await gsmService.sendCommand(
          request.params.id,
          request.body.command,
          request.body.data
        );

        const response: ApiResponse<GSMCommand> = {
          success: true,
          data: cmd,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'COMMAND_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // GET /api/gsm/:id/commands - Get command history
  server.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/:id/commands',
    async (
      request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const limit = request.query.limit ? parseInt(request.query.limit) : 50;
        const commands = await gsmService.getCommandHistory(request.params.id, limit);

        const response: ApiResponse<GSMCommand[]> = {
          success: true,
          data: commands,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'COMMAND_HISTORY_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // =============================================
  // TELEMETRY ENDPOINTS
  // =============================================

  /**
   * Get device telemetry
   * GET /api/gsm/:id/telemetry
   */
  server.get<{ Params: { id: string } }>(
    '/:id/telemetry',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const {
          metric_name,
          start_time,
          end_time,
          limit,
          aggregation,
        } = request.query as any;

        const query: any = {
          device_id: id,
          device_type: 'gsm',
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

        const response: ApiResponse = {
          success: true,
          data: telemetry,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'TELEMETRY_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Get latest telemetry for device
   * GET /api/gsm/:id/telemetry/latest
   */
  server.get<{ Params: { id: string } }>(
    '/:id/telemetry/latest',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const latest = await telemetryService.getLatestTelemetry(id, 'gsm');

        const response: ApiResponse = {
          success: true,
          data: latest,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'TELEMETRY_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Record telemetry data point
   * POST /api/gsm/:id/telemetry
   */
  server.post<{ Params: { id: string } }>(
    '/:id/telemetry',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { metric_name, metric_value, metric_unit, metadata, timestamp } = request.body as any;

        if (!metric_name || metric_value === undefined) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required fields: metric_name, metric_value',
            },
            timestamp: new Date(),
          };
          return reply.status(400).send(response);
        }

        const telemetry = await telemetryService.recordTelemetry({
          device_id: id,
          device_type: 'gsm',
          metric_name,
          metric_value: parseFloat(metric_value),
          metric_unit,
          metadata,
          timestamp: timestamp ? new Date(timestamp) : undefined,
        });

        const response: ApiResponse = {
          success: true,
          data: telemetry,
          timestamp: new Date(),
        };
        return reply.status(201).send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'TELEMETRY_RECORD_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Get telemetry statistics
   * GET /api/gsm/:id/telemetry/stats
   */
  server.get<{ Params: { id: string } }>(
    '/:id/telemetry/stats',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { metric_name } = request.query as any;

        const stats = await telemetryService.getTelemetryStats(id, 'gsm', metric_name);

        const response: ApiResponse = {
          success: true,
          data: stats,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'TELEMETRY_STATS_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // =============================================
  // LOGS ENDPOINTS
  // =============================================

  /**
   * Get device logs
   * GET /api/gsm/:id/logs
   */
  server.get<{ Params: { id: string } }>(
    '/:id/logs',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const {
          log_level,
          event_type,
          start_time,
          end_time,
          limit,
        } = request.query as any;

        const query: any = {
          device_id: id,
          device_type: 'gsm',
          log_level,
          event_type,
          limit: limit ? parseInt(limit) : 1000,
        };

        if (start_time) query.start_time = new Date(start_time);
        if (end_time) query.end_time = new Date(end_time);

        const logs = await logsService.getLogs(query);

        const response: ApiResponse = {
          success: true,
          data: logs,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'LOGS_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Get device error logs
   * GET /api/gsm/:id/logs/errors
   */
  server.get<{ Params: { id: string } }>(
    '/:id/logs/errors',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { limit } = request.query as any;

        const logs = await logsService.getErrorLogs(id, limit ? parseInt(limit) : 100);

        const response: ApiResponse = {
          success: true,
          data: logs,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'LOGS_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Get recent device logs
   * GET /api/gsm/:id/logs/recent
   */
  server.get<{ Params: { id: string } }>(
    '/:id/logs/recent',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { limit } = request.query as any;

        const logs = await logsService.getRecentLogs(id, limit ? parseInt(limit) : 100);

        const response: ApiResponse = {
          success: true,
          data: logs,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'LOGS_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Create device log entry
   * POST /api/gsm/:id/logs
   */
  server.post<{ Params: { id: string } }>(
    '/:id/logs',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { log_level, event_type, message, details, timestamp } = request.body as any;

        if (!log_level || !event_type || !message) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required fields: log_level, event_type, message',
            },
            timestamp: new Date(),
          };
          return reply.status(400).send(response);
        }

        const log = await logsService.createLog({
          device_id: id,
          device_type: 'gsm',
          log_level,
          event_type,
          message,
          details,
          timestamp: timestamp ? new Date(timestamp) : undefined,
        });

        const response: ApiResponse = {
          success: true,
          data: log,
          timestamp: new Date(),
        };
        return reply.status(201).send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'LOG_CREATE_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Get log statistics
   * GET /api/gsm/:id/logs/stats
   */
  server.get<{ Params: { id: string } }>(
    '/:id/logs/stats',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const stats = await logsService.getLogStats(id);

        const response: ApiResponse = {
          success: true,
          data: stats,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'LOG_STATS_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  // =============================================
  // CONFIGURATION ENDPOINTS
  // =============================================

  /**
   * Get active device configuration
   * GET /api/gsm/:id/configuration
   */
  server.get<{ Params: { id: string } }>(
    '/:id/configuration',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const config = await logsService.getActiveConfiguration(id);

        const response: ApiResponse = {
          success: true,
          data: config,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'CONFIG_FETCH_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Save device configuration
   * POST /api/gsm/:id/configuration
   */
  server.post<{ Params: { id: string } }>(
    '/:id/configuration',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { configuration, changed_by, change_reason } = request.body as any;

        if (!configuration) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required field: configuration',
            },
            timestamp: new Date(),
          };
          return reply.status(400).send(response);
        }

        const config = await logsService.saveConfiguration(
          id,
          'gsm',
          configuration,
          changed_by,
          change_reason
        );

        const response: ApiResponse = {
          success: true,
          data: config,
          timestamp: new Date(),
        };
        return reply.status(201).send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'CONFIG_SAVE_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );

  /**
   * Get configuration history
   * GET /api/gsm/:id/configuration/history
   */
  server.get<{ Params: { id: string } }>(
    '/:id/configuration/history',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { limit } = request.query as any;

        const history = await logsService.getConfigurationHistory(id, limit ? parseInt(limit) : 50);

        const response: ApiResponse = {
          success: true,
          data: history,
          timestamp: new Date(),
        };
        return reply.send(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'CONFIG_HISTORY_FAILED',
            message: (error as Error).message,
          },
          timestamp: new Date(),
        };
        return reply.status(500).send(response);
      }
    }
  );
};
