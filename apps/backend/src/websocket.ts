import { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { createLogger } from '@webscada/utils';
import { EventType, ScadaEvent } from '@webscada/shared-types';

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

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}
