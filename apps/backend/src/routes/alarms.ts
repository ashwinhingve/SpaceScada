import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Alarm, ApiResponse } from '@webscada/shared-types';

export const alarmRoutes = async (server: FastifyInstance) => {
  // GET /api/alarms
  server.get<{ Querystring: { acknowledged?: string } }>(
    '/',
    async (
      request: FastifyRequest<{ Querystring: { acknowledged?: string } }>,
      reply: FastifyReply
    ) => {
      const { acknowledged } = request.query;

      // TODO: Fetch alarms from database
      const response: ApiResponse<Alarm[]> = {
        success: true,
        data: [],
        timestamp: new Date(),
      };
      return reply.send(response);
    }
  );

  // POST /api/alarms/:id/acknowledge
  server.post<{ Params: { id: string } }>(
    '/:id/acknowledge',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      // TODO: Acknowledge alarm in database
      const response: ApiResponse<Alarm> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Alarm ${id} not found`,
        },
        timestamp: new Date(),
      };
      return reply.status(404).send(response);
    }
  );
};
