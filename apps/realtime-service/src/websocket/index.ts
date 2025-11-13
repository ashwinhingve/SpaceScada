import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config';
import { logInfo, logError, logDebug } from '../utils/logger';
import { MetricsService } from '../services/metrics-service';
import {
  WebSocketEvent,
  SubscribePayload,
  UnsubscribePayload,
  ConnectionInfo,
} from '../types';

export class WebSocketServer {
  private io: SocketIOServer;
  private connections: Map<string, ConnectionInfo> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    httpServer: HTTPServer,
    private metrics: MetricsService
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: config.heartbeatInterval,
      pingTimeout: config.heartbeatTimeout,
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    logInfo('WebSocket server initialized');
  }

  private setupEventHandlers(): void {
    this.io.on(WebSocketEvent.CONNECTION, (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket): void {
    const connInfo: ConnectionInfo = {
      id: socket.id,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      subscribedDevices: new Set(),
    };

    this.connections.set(socket.id, connInfo);
    this.metrics.incrementWebSocketConnections();

    logInfo('Client connected', { socketId: socket.id, totalConnections: this.connections.size });

    // Subscribe event
    socket.on(WebSocketEvent.SUBSCRIBE, (payload: SubscribePayload) => {
      this.handleSubscribe(socket, payload);
    });

    // Unsubscribe event
    socket.on(WebSocketEvent.UNSUBSCRIBE, (payload: UnsubscribePayload) => {
      this.handleUnsubscribe(socket, payload);
    });

    // Heartbeat event
    socket.on(WebSocketEvent.HEARTBEAT, () => {
      this.handleHeartbeat(socket);
    });

    // Disconnect event
    socket.on(WebSocketEvent.DISCONNECT, (reason: string) => {
      this.handleDisconnect(socket, reason);
    });

    // Error handling
    socket.on('error', (error: Error) => {
      logError('Socket error', error, { socketId: socket.id });
    });
  }

  private handleSubscribe(socket: Socket, payload: SubscribePayload): void {
    const connInfo = this.connections.get(socket.id);
    if (!connInfo) return;

    try {
      logDebug('Client subscribing to devices', {
        socketId: socket.id,
        deviceIds: payload.deviceIds,
      });

      payload.deviceIds.forEach((deviceId) => {
        const room = `device:${deviceId}`;
        socket.join(room);
        connInfo.subscribedDevices.add(deviceId);
      });

      socket.emit(WebSocketEvent.SUBSCRIBE, {
        success: true,
        deviceIds: payload.deviceIds,
        timestamp: new Date(),
      });

      this.metrics.recordWebSocketMessage('subscribe');
    } catch (error) {
      logError('Error in subscribe handler', error, { socketId: socket.id });
      socket.emit(WebSocketEvent.ERROR, {
        code: 'SUBSCRIBE_ERROR',
        message: 'Failed to subscribe to devices',
      });
    }
  }

  private handleUnsubscribe(socket: Socket, payload: UnsubscribePayload): void {
    const connInfo = this.connections.get(socket.id);
    if (!connInfo) return;

    try {
      logDebug('Client unsubscribing from devices', {
        socketId: socket.id,
        deviceIds: payload.deviceIds,
      });

      payload.deviceIds.forEach((deviceId) => {
        const room = `device:${deviceId}`;
        socket.leave(room);
        connInfo.subscribedDevices.delete(deviceId);
      });

      socket.emit(WebSocketEvent.UNSUBSCRIBE, {
        success: true,
        deviceIds: payload.deviceIds,
        timestamp: new Date(),
      });

      this.metrics.recordWebSocketMessage('unsubscribe');
    } catch (error) {
      logError('Error in unsubscribe handler', error, { socketId: socket.id });
      socket.emit(WebSocketEvent.ERROR, {
        code: 'UNSUBSCRIBE_ERROR',
        message: 'Failed to unsubscribe from devices',
      });
    }
  }

  private handleHeartbeat(socket: Socket): void {
    const connInfo = this.connections.get(socket.id);
    if (connInfo) {
      connInfo.lastHeartbeat = new Date();
      socket.emit(WebSocketEvent.PONG, { timestamp: new Date() });
    }
  }

  private handleDisconnect(socket: Socket, reason: string): void {
    const connInfo = this.connections.get(socket.id);

    if (connInfo) {
      // Leave all rooms
      connInfo.subscribedDevices.forEach((deviceId) => {
        socket.leave(`device:${deviceId}`);
      });

      this.connections.delete(socket.id);
      this.metrics.decrementWebSocketConnections();

      logInfo('Client disconnected', {
        socketId: socket.id,
        reason,
        duration: Date.now() - connInfo.connectedAt.getTime(),
        totalConnections: this.connections.size,
      });
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      this.connections.forEach((connInfo, socketId) => {
        const timeSinceLastHeartbeat = now - connInfo.lastHeartbeat.getTime();

        // Disconnect stale connections
        if (timeSinceLastHeartbeat > config.heartbeatTimeout) {
          logInfo('Disconnecting stale connection', {
            socketId,
            timeSinceLastHeartbeat,
          });

          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      });
    }, config.heartbeatInterval);
  }

  getIO(): SocketIOServer {
    return this.io;
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getConnectionsInfo(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  getRoomSize(deviceId: string): number {
    const room = `device:${deviceId}`;
    return this.io.sockets.adapter.rooms.get(room)?.size || 0;
  }

  async close(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    logInfo('Closing WebSocket server');

    // Disconnect all clients
    this.io.disconnectSockets(true);

    // Close server
    return new Promise((resolve) => {
      this.io.close(() => {
        logInfo('WebSocket server closed');
        resolve();
      });
    });
  }
}
