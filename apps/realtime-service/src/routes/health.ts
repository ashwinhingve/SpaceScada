import { FastifyInstance } from 'fastify';
import { HealthResponse } from '../types';
import { createSuccessResponse } from '../middleware/error-handler';

export const healthRoutes = async (fastify: FastifyInstance, getConnectionCount: () => number) => {
  fastify.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  uptime: { type: 'number' },
                  memory: { type: 'object' },
                  connections: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;

      const health: HealthResponse = {
        status: 'ok',
        uptime: process.uptime(),
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: (usedMemory / totalMemory) * 100,
        },
        connections: {
          total: getConnectionCount(),
          byRoom: {},
        },
        timestamp: new Date(),
      };

      return reply.send(createSuccessResponse(health));
    }
  );
};
