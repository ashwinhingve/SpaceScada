import { FastifyInstance } from 'fastify';
import { MetricsService } from '../services/metrics-service';

export const metricsRoutes = async (fastify: FastifyInstance, metrics: MetricsService) => {
  fastify.get(
    '/metrics',
    {
      schema: {
        description: 'Prometheus metrics endpoint',
        tags: ['metrics'],
        response: {
          200: {
            type: 'string',
          },
        },
      },
    },
    async (request, reply) => {
      if (!metrics.isEnabled()) {
        return reply.status(404).send('Metrics disabled');
      }

      const metricsData = await metrics.getMetrics();
      reply.header('Content-Type', metrics.getContentType());
      return reply.send(metricsData);
    }
  );
};
