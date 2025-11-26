/**
 * Base Protocol Adapter Implementation
 *
 * Provides common functionality for all protocol adapters:
 * - Connection state management
 * - Health monitoring
 * - Error handling
 * - Metrics collection
 */

import {
  IProtocolAdapter,
  ConnectionConfig,
  ConnectionState,
  AdapterHealth,
  DataPoint,
  BulkReadRequest,
  BulkReadResponse,
  DeviceDiscovery,
  DataCallback,
  ErrorCallback,
  SubscriptionOptions,
  ProtocolCapabilities,
} from './protocol-adapter.interface';

export abstract class BaseProtocolAdapter implements IProtocolAdapter {
  protected config?: ConnectionConfig;
  protected connectionState: ConnectionState = {
    status: 'disconnected',
    reconnectAttempts: 0,
  };

  protected health: AdapterHealth = {
    isHealthy: true,
    uptime: 0,
    totalReads: 0,
    totalWrites: 0,
    failedReads: 0,
    failedWrites: 0,
    avgReadLatency: 0,
    avgWriteLatency: 0,
  };

  private startTime?: number;
  private readLatencies: number[] = [];
  private writeLatencies: number[] = [];
  private readonly MAX_LATENCY_SAMPLES = 100;

  /**
   * Abstract methods that must be implemented by protocol-specific adapters
   */
  protected abstract doConnect(config: ConnectionConfig): Promise<void>;
  protected abstract doDisconnect(): Promise<void>;
  protected abstract doRead(address: string): Promise<DataPoint>;
  protected abstract doWrite(address: string, value: unknown): Promise<void>;

  /**
   * Get protocol capabilities (must be overridden)
   */
  abstract getCapabilities(): ProtocolCapabilities;

  /**
   * Connect to device/network
   */
  async connect(config: ConnectionConfig): Promise<void> {
    this.config = config;
    this.connectionState.status = 'connecting';

    try {
      await this.doConnect(config);
      this.connectionState.status = 'connected';
      this.connectionState.lastConnected = Date.now();
      this.connectionState.reconnectAttempts = 0;
      this.connectionState.error = undefined;
      this.startTime = Date.now();
      this.health.isHealthy = true;
    } catch (error) {
      this.connectionState.status = 'error';
      this.connectionState.error = error as Error;
      this.health.isHealthy = false;
      this.health.lastError = error as Error;
      throw error;
    }
  }

  /**
   * Disconnect from device/network
   */
  async disconnect(): Promise<void> {
    try {
      await this.doDisconnect();
      this.connectionState.status = 'disconnected';
      this.connectionState.lastDisconnected = Date.now();
    } catch (error) {
      this.connectionState.error = error as Error;
      throw error;
    }
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Read single data point with metrics tracking
   */
  async read(address: string): Promise<DataPoint> {
    const startTime = performance.now();

    try {
      const dataPoint = await this.doRead(address);
      const latency = performance.now() - startTime;

      this.health.totalReads++;
      this.updateReadLatency(latency);

      return dataPoint;
    } catch (error) {
      this.health.failedReads++;
      this.health.lastError = error as Error;
      throw error;
    }
  }

  /**
   * Write single data point with metrics tracking
   */
  async write(address: string, value: unknown): Promise<void> {
    const startTime = performance.now();

    try {
      await this.doWrite(address, value);
      const latency = performance.now() - startTime;

      this.health.totalWrites++;
      this.updateWriteLatency(latency);
    } catch (error) {
      this.health.failedWrites++;
      this.health.lastError = error as Error;
      throw error;
    }
  }

  /**
   * Bulk read (default implementation - can be overridden for optimization)
   */
  async readBulk(request: BulkReadRequest): Promise<BulkReadResponse> {
    const dataPoints = new Map<string, DataPoint>();
    const errors = new Map<string, Error>();

    await Promise.allSettled(
      request.addresses.map(async (address) => {
        try {
          const dataPoint = await this.read(address);
          dataPoints.set(address, dataPoint);
        } catch (error) {
          errors.set(address, error as Error);
        }
      })
    );

    return { dataPoints, errors };
  }

  /**
   * Subscribe to data point changes (default: not supported)
   */
  async subscribe(
    _addresses: string[],
    _callback: DataCallback,
    _errorCallback?: ErrorCallback,
    _options?: SubscriptionOptions
  ): Promise<string> {
    throw new Error('Subscribe not supported by this protocol adapter');
  }

  /**
   * Unsubscribe from data point changes
   */
  async unsubscribe(_subscriptionId: string): Promise<void> {
    throw new Error('Unsubscribe not supported by this protocol adapter');
  }

  /**
   * Discover devices on network (default: not supported)
   */
  async discoverDevices(): Promise<DeviceDiscovery[]> {
    throw new Error('Device discovery not supported by this protocol adapter');
  }

  /**
   * Browse available data points (default: not supported)
   */
  async browseDataPoints(_deviceId?: string): Promise<DataPoint[]> {
    throw new Error('Data point browsing not supported by this protocol adapter');
  }

  /**
   * Get adapter health metrics
   */
  getHealth(): AdapterHealth {
    const uptime = this.startTime ? Date.now() - this.startTime : 0;
    return {
      ...this.health,
      uptime,
    };
  }

  /**
   * Update read latency metrics
   */
  private updateReadLatency(latency: number): void {
    this.readLatencies.push(latency);
    if (this.readLatencies.length > this.MAX_LATENCY_SAMPLES) {
      this.readLatencies.shift();
    }
    this.health.avgReadLatency =
      this.readLatencies.reduce((a, b) => a + b, 0) / this.readLatencies.length;
  }

  /**
   * Update write latency metrics
   */
  private updateWriteLatency(latency: number): void {
    this.writeLatencies.push(latency);
    if (this.writeLatencies.length > this.MAX_LATENCY_SAMPLES) {
      this.writeLatencies.shift();
    }
    this.health.avgWriteLatency =
      this.writeLatencies.reduce((a, b) => a + b, 0) / this.writeLatencies.length;
  }
}
