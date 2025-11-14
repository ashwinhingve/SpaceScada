import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { useDashboardStore } from '@/store/dashboard-store';
import { ConnectionStatus, DataUpdatePayload, DeviceStatusPayload } from '@/types/dashboard';

interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const { url, autoConnect = true, maxReconnectAttempts = 10 } = options;

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();

  const {
    setConnectionStatus,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    updateDeviceTags,
    updateDeviceStatus,
  } = useDashboardStore();

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempts: number): number => {
    return Math.min(1000 * Math.pow(2, attempts), 30000);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setConnectionStatus(ConnectionStatus.CONNECTING);

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: false, // We'll handle reconnection manually
    });

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      resetReconnectAttempts();

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        socket.emit('heartbeat');
      }, 30000);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);

      // Clear heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Attempt reconnection with exponential backoff
      // Get fresh reconnectAttempts from store to avoid stale closure
      const currentAttempts = useDashboardStore.getState().reconnectAttempts;

      if (currentAttempts < maxReconnectAttempts) {
        const delay = getReconnectDelay(currentAttempts);
        console.log(
          `Reconnecting in ${delay}ms (attempt ${currentAttempts + 1}/${maxReconnectAttempts})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          incrementReconnectAttempts();
          connect();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
        setConnectionStatus(ConnectionStatus.ERROR);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionStatus(ConnectionStatus.ERROR);
    });

    // Data update event
    socket.on('data:update', (payload: DataUpdatePayload) => {
      updateDeviceTags(payload.deviceId, payload.tags);
    });

    // Device status event
    socket.on('device:status', (payload: DeviceStatusPayload) => {
      updateDeviceStatus(payload.deviceId, payload.status);
    });

    // Pong response
    socket.on('pong', () => {
      // Heartbeat acknowledged
    });

    // Error event
    socket.on('error', (error: { code: string; message: string }) => {
      console.error('WebSocket error:', error);
    });

    socketRef.current = socket;
  }, [
    url,
    setConnectionStatus,
    resetReconnectAttempts,
    incrementReconnectAttempts,
    maxReconnectAttempts,
    getReconnectDelay,
    updateDeviceTags,
    updateDeviceStatus,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionStatus(ConnectionStatus.DISCONNECTED);
  }, [setConnectionStatus]);

  // Subscribe to devices
  const subscribe = useCallback((deviceIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { deviceIds });
    }
  }, []);

  // Unsubscribe from devices
  const unsubscribe = useCallback((deviceIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', { deviceIds });
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]); // Only run on mount - connect/disconnect intentionally excluded

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    isConnected: socketRef.current?.connected ?? false,
  };
};
