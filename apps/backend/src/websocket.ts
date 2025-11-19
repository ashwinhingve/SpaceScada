import { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { createLogger } from '@webscada/utils';
import { EventType, ScadaEvent, GSMEvent, GSMEventType } from '@webscada/shared-types';

const logger = createLogger({ prefix: 'WebSocket' });

export const setupWebSocket = async (server: FastifyInstance) => {
  const io = new Server(server.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    socket.on('subscribe:tags', (tagIds: string[]) => {
      logger.info(`Client ${socket.id} subscribed to tags:`, tagIds);
      // TODO: Implement tag subscription
    });

    socket.on('unsubscribe:tags', (tagIds: string[]) => {
      logger.info(`Client ${socket.id} unsubscribed from tags:`, tagIds);
      // TODO: Implement tag unsubscription
    });

    // GSM device subscriptions
    socket.on('subscribe:gsm', (deviceIds: string[]) => {
      logger.info(`Client ${socket.id} subscribed to GSM devices:`, deviceIds);
      deviceIds.forEach((deviceId) => {
        socket.join(`gsm:${deviceId}`);
      });
    });

    socket.on('unsubscribe:gsm', (deviceIds: string[]) => {
      logger.info(`Client ${socket.id} unsubscribed from GSM devices:`, deviceIds);
      deviceIds.forEach((deviceId) => {
        socket.leave(`gsm:${deviceId}`);
      });
    });

    // ESP32 device subscriptions
    socket.on('subscribe:esp32', (deviceIds: string[]) => {
      logger.info(`Client ${socket.id} subscribed to ESP32 devices:`, deviceIds);
      deviceIds.forEach((deviceId) => {
        socket.join(`esp32:${deviceId}`);
      });
    });

    socket.on('unsubscribe:esp32', (deviceIds: string[]) => {
      logger.info(`Client ${socket.id} unsubscribed from ESP32 devices:`, deviceIds);
      deviceIds.forEach((deviceId) => {
        socket.leave(`esp32:${deviceId}`);
      });
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Store io instance for broadcasting events
  server.decorate('io', io);

  logger.info('WebSocket server initialized');
};

// Helper function to broadcast events
export const broadcastEvent = (io: Server, event: ScadaEvent) => {
  switch (event.type) {
    case EventType.TAG_UPDATE:
      io.emit('tag:update', event.payload);
      break;
    case EventType.DEVICE_STATUS:
      io.emit('device:status', event.payload);
      break;
    case EventType.ALARM_TRIGGERED:
      io.emit('alarm:triggered', event.payload);
      break;
    case EventType.ALARM_ACKNOWLEDGED:
      io.emit('alarm:acknowledged', event.payload);
      break;
  }
};

// Helper function to broadcast GSM events
export const broadcastGSMEvent = (io: Server, deviceId: string, event: GSMEvent) => {
  const room = `gsm:${deviceId}`;

  switch (event.type) {
    case GSMEventType.SMS_RECEIVED:
      io.to(room).emit('gsm:sms-received', event.payload);
      logger.info(`Broadcasting SMS received event to room: ${room}`);
      break;
    case GSMEventType.SMS_SENT:
      io.to(room).emit('gsm:sms-sent', event.payload);
      logger.info(`Broadcasting SMS sent event to room: ${room}`);
      break;
    case GSMEventType.GPS_UPDATE:
      io.to(room).emit('gsm:gps-update', event.payload);
      logger.debug(`Broadcasting GPS update event to room: ${room}`);
      break;
    case GSMEventType.NETWORK_STATUS_UPDATE:
      io.to(room).emit('gsm:network-status', event.payload);
      logger.debug(`Broadcasting network status event to room: ${room}`);
      break;
    case GSMEventType.COMMAND_RESPONSE:
      io.to(room).emit('gsm:command-response', event.payload);
      logger.info(`Broadcasting command response event to room: ${room}`);
      break;
  }
};

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}
