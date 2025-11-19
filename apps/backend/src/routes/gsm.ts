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

/**
 * GSM Device Routes
 * Handles all GSM device operations including SMS, GPS, and network monitoring
 */
export const gsmRoutes = async (server: FastifyInstance) => {
  // Initialize GSM service
  const gsmService = (server as any).gsmService as GSMService;

  if (!gsmService) {
    throw new Error('GSM Service not initialized');
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
};
