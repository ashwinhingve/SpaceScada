import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { FastifyInstance } from 'fastify';

import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { deviceRoutes } from './routes/devices';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';
import { DeviceService } from './services/device-service';
import { MetricsService } from './services/metrics-service';
import { SimulationEngine } from './simulation/engine';
import { logInfo } from './utils/logger';
import { WebSocketServer } from './websocket';

export const createServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({
    logger: true,
    trustProxy: true,
    disableRequestLogging: false,
  });

  // Security plugins
  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Initialize services
  const metrics = new MetricsService();
  const deviceService = new DeviceService();

  // Setup WebSocket server
  const wsServer = new WebSocketServer(server.server as any, metrics);

  // Initialize simulation engine
  const simulationEngine = new SimulationEngine(wsServer.getIO());
  const simulator = simulationEngine.getSimulator();

  // Middleware for metrics
  server.addHook('onRequest', async (request, _reply) => {
    request.startTime = Date.now();
  });

  server.addHook('onResponse', async (request, reply) => {
    const duration = (Date.now() - (request.startTime || Date.now())) / 1000;
    const method = request.method;
    const path = request.routerPath || request.url;
    const status = reply.statusCode;

    metrics.recordHttpRequest(method, path, status);
    metrics.recordRequestDuration(method, path, status, duration);
  });

  // Register API routes
  await server.register(
    async (instance) => {
      await deviceRoutes(instance, simulator, deviceService);
    },
    { prefix: '/api' }
  );

  await server.register(
    async (instance) => {
      await healthRoutes(instance, () => wsServer.getConnectionCount());
    },
    { prefix: '/api' }
  );

  await server.register(
    async (instance) => {
      await metricsRoutes(instance, metrics);
    },
    { prefix: '/api' }
  );

  // Root endpoint
  server.get('/', async () => {
    return {
      service: 'WebSCADA Real-time Service',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        api: '/api/devices',
        health: '/api/health',
        metrics: '/api/metrics',
      },
      websocket: {
        enabled: true,
        connections: wsServer.getConnectionCount(),
      },
    };
  });

  // Error handler
  server.setErrorHandler(errorHandler);

  // Start simulation engine
  simulationEngine.start();

  // Store references for cleanup
  server.decorate('wsServer', wsServer);
  server.decorate('simulationEngine', simulationEngine);
  server.decorate('deviceService', deviceService);

  logInfo('Server initialized', {
    nodeEnv: config.nodeEnv,
    corsOrigin: config.corsOrigin,
    updateInterval: config.updateInterval,
  });

  return server;
};

// Type declarations for decorated properties
declare module 'fastify' {
  interface FastifyInstance {
    wsServer: WebSocketServer;
    simulationEngine: SimulationEngine;
    deviceService: DeviceService;
  }

  interface FastifyRequest {
    startTime?: number;
  }
}
