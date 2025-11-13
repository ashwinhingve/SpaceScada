import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Tag, ApiResponse } from '@webscada/shared-types';

export const tagRoutes = async (server: FastifyInstance) => {
  // GET /api/tags
  server.get<{ Querystring: { deviceId?: string } }>(
    '/',
    async (
      request: FastifyRequest<{ Querystring: { deviceId?: string } }>,
      reply: FastifyReply
    ) => {
      const { deviceId } = request.query;

      // TODO: Fetch tags from database
      const response: ApiResponse<Tag[]> = {
        success: true,
        data: [],
        timestamp: new Date(),
      };
      return reply.send(response);
    }
  );

  // GET /api/tags/:id
  server.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      // TODO: Fetch tag from database
      const response: ApiResponse<Tag> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Tag ${id} not found`,
        },
        timestamp: new Date(),
      };
      return reply.status(404).send(response);
    }
  );
};
