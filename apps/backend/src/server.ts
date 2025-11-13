import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { createLogger } from '@webscada/utils';

import { deviceRoutes } from './routes/devices';
import { tagRoutes } from './routes/tags';
import { alarmRoutes } from './routes/alarms';
import { setupWebSocket } from './websocket';
import { DatabaseService } from './services/database';
import { RedisService } from './services/redis';

const logger = createLogger({ prefix: 'Server' });

export const createServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({
    logger: false,
    trustProxy: true,
  });

  // Security plugins
  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  });

  // Initialize services
  const database = DatabaseService.getInstance();
  const redis = RedisService.getInstance();

  await database.connect();
  await redis.connect();

  // Register routes
  await server.register(deviceRoutes, { prefix: '/api/devices' });
  await server.register(tagRoutes, { prefix: '/api/tags' });
  await server.register(alarmRoutes, { prefix: '/api/alarms' });

  // Setup WebSocket
  await setupWebSocket(server);

  // Health check
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Error handler
  server.setErrorHandler((error, request, reply) => {
    logger.error('Request error:', { error, url: request.url });

    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date(),
    });
  });

  return server;
};
