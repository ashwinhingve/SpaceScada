import { Device, ApiResponse } from '@webscada/shared-types';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export const deviceRoutes = async (server: FastifyInstance) => {
  // GET /api/devices
  server.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const response: ApiResponse<Device[]> = {
      success: true,
      data: [],
      timestamp: new Date(),
    };
    return reply.send(response);
  });

  // GET /api/devices/:id
  server.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      // TODO: Fetch device from database
      const response: ApiResponse<Device> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Device ${id} not found`,
        },
        timestamp: new Date(),
      };
      return reply.status(404).send(response);
    }
  );

  // POST /api/devices
  server.post<{ Body: Partial<Device> }>(
    '/',
    async (request: FastifyRequest<{ Body: Partial<Device> }>, reply: FastifyReply) => {
      const deviceData = request.body;

      // TODO: Create device in database
      const response: ApiResponse<Device> = {
        success: true,
        data: deviceData as Device,
        timestamp: new Date(),
      };
      return reply.status(201).send(response);
    }
  );

  // PUT /api/devices/:id
  server.put<{ Params: { id: string }; Body: Partial<Device> }>(
    '/:id',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Partial<Device> }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const deviceData = request.body;

      // TODO: Update device in database
      const response: ApiResponse<Device> = {
        success: true,
        data: { ...deviceData, id } as Device,
        timestamp: new Date(),
      };
      return reply.send(response);
    }
  );

  // DELETE /api/devices/:id
  server.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id: _id } = request.params;

      // TODO: Delete device from database
      const response: ApiResponse<void> = {
        success: true,
        timestamp: new Date(),
      };
      return reply.send(response);
    }
  );
};
