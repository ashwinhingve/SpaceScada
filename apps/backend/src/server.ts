import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { createLogger } from '@webscada/utils';
import Fastify, { FastifyInstance } from 'fastify';

import { alarmRoutes } from './routes/alarms';
import apiKeysRoutes from './routes/api-keys';
import { bluetoothRoutes } from './routes/bluetooth';
import { deviceRoutes } from './routes/devices';
import { esp32Routes } from './routes/esp32';
import { gsmRoutes } from './routes/gsm';
import { lorawanRoutes } from './routes/lorawan';
import notificationsRoutes from './routes/notifications';
import oauthRoutes from './routes/oauth';
import sessionsRoutes from './routes/sessions';
import { tagRoutes } from './routes/tags';
import usersRoutes from './routes/users';
import widgetsRoutes from './routes/widgets';
import { wifiRoutes } from './routes/wifi';
import { BluetoothService } from './services/bluetooth.service';
import { DatabaseService } from './services/database';
import { ESP32Service } from './services/esp32.service';
import { GSMService } from './services/gsm.service';
import { influxTimeSeriesService } from './services/influx-timeseries.service';
import { LogsService } from './services/logs.service';
import { mqttValveService } from './services/mqtt-valve.service';
import { RedisService } from './services/redis';
import { TelemetryService } from './services/telemetry.service';
import { WiFiService } from './services/wifi.service';
import { setupWebSocket } from './websocket';

 
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

  // Add database connection as decorator for routes
  server.decorate('pg', database.getPool());

  // Initialize GSM service
  const gsmService = new GSMService(database);
  server.decorate('gsmService', gsmService);

  // Initialize ESP32 service
  const esp32Service = new ESP32Service(database);
  server.decorate('esp32Service', esp32Service);

  // Initialize ESP32 MQTT connection
  const mqttBroker = process.env.MQTT_BROKER_HOST || 'localhost';
  const mqttPort = parseInt(process.env.MQTT_BROKER_PORT || '1883', 10);
  await esp32Service.initialize(mqttBroker, mqttPort);

  // Initialize Wi-Fi service
  const wifiService = new WiFiService(database);
  server.decorate('wifiService', wifiService);

  // Initialize Bluetooth service
  const bluetoothService = new BluetoothService(database);
  server.decorate('bluetoothService', bluetoothService);

  // Initialize Telemetry service
  const telemetryService = new TelemetryService(database);
  server.decorate('telemetryService', telemetryService);

  // Initialize Logs service
  const logsService = new LogsService(database);
  server.decorate('logsService', logsService);

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
  await server.register(wifiRoutes, { prefix: '/api/wifi' });
  await server.register(bluetoothRoutes, { prefix: '/api/bluetooth' });
  await server.register(lorawanRoutes, { prefix: '' }); // LoRaWAN routes already include /api prefix

  // Register valve control routes
  const { valveRoutes } = await import('./routes/valves');
  await server.register(valveRoutes, { prefix: '/api' });
  logger.info('Valve control routes registered');

  // Register user management routes
  await server.register(usersRoutes);
  await server.register(notificationsRoutes);
  await server.register(apiKeysRoutes);
  await server.register(sessionsRoutes);
  await server.register(oauthRoutes);
  logger.info('User management routes registered');

  // Register dashboard widgets routes
  await server.register(widgetsRoutes);
  logger.info('Dashboard widgets routes registered');

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
