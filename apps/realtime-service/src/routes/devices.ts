import { FastifyInstance } from 'fastify';
import { DeviceSimulator } from '../simulation/devices';
import { DeviceService } from '../services/device-service';
import { createSuccessResponse, createErrorResponse } from '../middleware/error-handler';
import { logInfo } from '../utils/logger';

export const deviceRoutes = async (
  fastify: FastifyInstance,
  simulator: DeviceSimulator,
  deviceService: DeviceService
) => {
  // GET /api/devices - List all devices
  fastify.get(
    '/devices',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      logInfo('GET /api/devices', { ip: request.ip });

      const devices = simulator.getAllDevices();
      return reply.send(createSuccessResponse(devices));
    }
  );

  // GET /api/devices/:id - Get specific device
  fastify.get<{ Params: { id: string } }>(
    '/devices/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      logInfo('GET /api/devices/:id', { deviceId: id });

      const device = simulator.getDevice(id);

      if (!device) {
        return reply.status(404).send(createErrorResponse('DEVICE_NOT_FOUND', 'Device not found'));
      }

      return reply.send(createSuccessResponse(device));
    }
  );

  // GET /api/devices/:id/data - Get device data with history
  fastify.get<{ Params: { id: string }; Querystring: { limit?: number } }>(
    '/devices/:id/data',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { limit } = request.query;

      logInfo('GET /api/devices/:id/data', { deviceId: id, limit });

      const device = simulator.getDevice(id);

      if (!device) {
        return reply.status(404).send(createErrorResponse('DEVICE_NOT_FOUND', 'Device not found'));
      }

      const history = deviceService.getDeviceHistory(id, device.tags);

      // Convert Map to object for JSON serialization
      const historyObject: Record<string, unknown> = {};
      history.forEach((value, key) => {
        historyObject[key] = limit ? value.slice(-limit) : value;
      });

      const response = {
        device,
        history: historyObject,
      };

      return reply.send(createSuccessResponse(response));
    }
  );

  // POST /api/devices/:id/value - Update device value
  fastify.post<{
    Params: { id: string };
    Body: { tagId: string; value: number | boolean };
  }>(
    '/devices/:id/value',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            tagId: { type: 'string' },
            value: { oneOf: [{ type: 'number' }, { type: 'boolean' }] },
          },
          required: ['tagId', 'value'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { tagId, value } = request.body;

      logInfo('POST /api/devices/:id/value', { deviceId: id, tagId, value });

      const device = simulator.getDevice(id);

      if (!device) {
        return reply.status(404).send(createErrorResponse('DEVICE_NOT_FOUND', 'Device not found'));
      }

      const success = simulator.updateDeviceValue(id, tagId, value);

      if (!success) {
        return reply.status(404).send(createErrorResponse('TAG_NOT_FOUND', 'Tag not found'));
      }

      return reply.send(
        createSuccessResponse({
          deviceId: id,
          tagId,
          value,
          updated: true,
        })
      );
    }
  );
};
