import { Server as SocketIOServer } from 'socket.io';

import { DeviceSimulator } from './devices';
import { config } from '../config';
import { WebSocketEvent, DataUpdatePayload } from '../types';
import { logInfo, logError, logDebug } from '../utils/logger';

export class SimulationEngine {
  private simulator: DeviceSimulator;
  private io: SocketIOServer;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.simulator = new DeviceSimulator();
  }

  start(): void {
    if (this.isRunning) {
      logInfo('Simulation engine already running');
      return;
    }

    logInfo('Starting simulation engine', { interval: config.updateInterval });

    this.intervalId = setInterval(() => {
      this.update();
    }, config.updateInterval);

    this.isRunning = true;
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logInfo('Stopping simulation engine');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.isRunning = false;
  }

  private update(): void {
    try {
      const updatedDevices = this.simulator.generateNextValues();

      logDebug('Generated updates', { deviceCount: updatedDevices.size });

      // Broadcast updates to subscribed clients
      updatedDevices.forEach((device) => {
        const payload: DataUpdatePayload = {
          deviceId: device.id,
          tags: device.tags,
          timestamp: new Date(),
        };

        // Emit to device-specific room
        this.io.to(`device:${device.id}`).emit(WebSocketEvent.DATA_UPDATE, payload);
      });
    } catch (error) {
      logError('Error in simulation update', error);
    }
  }

  getSimulator(): DeviceSimulator {
    return this.simulator;
  }

  isEngineRunning(): boolean {
    return this.isRunning;
  }

  reset(): void {
    logInfo('Resetting simulation engine');
    this.simulator.reset();
  }
}
