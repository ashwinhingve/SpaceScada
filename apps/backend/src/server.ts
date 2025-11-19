import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { createLogger } from '@webscada/utils';

import { deviceRoutes } from './routes/devices';
import { tagRoutes } from './routes/tags';
import { alarmRoutes } from './routes/alarms';
import { gsmRoutes } from './routes/gsm';
import { esp32Routes } from './routes/esp32';
import { setupWebSocket } from './websocket';
import { DatabaseService } from './services/database';
import { RedisService } from './services/redis';
import { GSMService } from './services/gsm.service';
import { ESP32Service } from './services/esp32.service';
import { mqttValveService } from './services/mqtt-valve.service';
import { influxTimeSeriesService } from './services/influx-timeseries.service';

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

  // Initialize GSM service
  const gsmService = new GSMService(database);
  (server as any).gsmService = gsmService;

  // Initialize ESP32 service
  const esp32Service = new ESP32Service(database);
  (server as any).esp32Service = esp32Service;

  // Initialize ESP32 MQTT connection
  const mqttBroker = process.env.MQTT_BROKER_HOST || 'localhost';
  const mqttPort = parseInt(process.env.MQTT_BROKER_PORT || '1883', 10);
  await esp32Service.initialize(mqttBroker, mqttPort);

  // Setup WebSocket first
  await setupWebSocket(server);

  // Set Socket.IO instance for ESP32 service
  esp32Service.setSocketIO(server.io);

  // Initialize InfluxDB for time-series data (optional)
  try {
    influxTimeSeriesService.initialize();
    logger.info('InfluxDB time-series service initialized');
  } catch (error) {
    logger.warn('InfluxDB not available, time-series features disabled');
  }

  // Initialize MQTT Valve Control Service
  const mqttValveBroker = process.env.MQTT_BROKER || `mqtt://${mqttBroker}:${mqttPort}`;
  mqttValveService.initialize(server.io, mqttValveBroker);
  logger.info('MQTT valve control service initialized');

  // Register routes
  await server.register(deviceRoutes, { prefix: '/api/devices' });
  await server.register(tagRoutes, { prefix: '/api/tags' });
  await server.register(alarmRoutes, { prefix: '/api/alarms' });
  await server.register(gsmRoutes, { prefix: '/api/gsm' });
  await server.register(esp32Routes, { prefix: '/api/esp32' });

  // Register valve control routes
  const { valveRoutes } = await import('./routes/valves');
  await server.register(valveRoutes, { prefix: '/api' });
  logger.info('Valve control routes registered');

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
