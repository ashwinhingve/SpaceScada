/**
 * Protocol Abstraction Layer (PAL)
 *
 * Unified interface for all industrial protocol adapters.
 * Enables protocol-agnostic device management and data normalization.
 */

export interface ProtocolCapabilities {
  supportsRead: boolean;
  supportsWrite: boolean;
  supportsSubscribe: boolean;
  supportsBulkOperations: boolean;
  supportsDiscovery: boolean;
  maxConcurrentConnections: number;
  reconnectionSupported: boolean;
}

export interface ConnectionConfig {
  protocol: ProtocolType;
  host?: string;
  port?: number;
  timeout?: number;
  retries?: number;
  credentials?: {
    username?: string;
    password?: string;
    certificate?: string;
    privateKey?: string;
    preSharedKey?: string;
  };
  options?: Record<string, unknown>;
}

export enum ProtocolType {
  MQTT = 'MQTT',
  MQTT_SPARKPLUG_B = 'MQTT_SPARKPLUG_B',
  MODBUS_TCP = 'MODBUS_TCP',
  MODBUS_RTU = 'MODBUS_RTU',
  OPC_UA = 'OPC_UA',
  LORAWAN = 'LORAWAN',
  GSM_HTTP = 'GSM_HTTP',
  BACNET = 'BACNET',
  DNP3 = 'DNP3',
  ETHERNET_IP = 'ETHERNET_IP',
}

export enum DataQuality {
  GOOD = 'GOOD',
  BAD = 'BAD',
  UNCERTAIN = 'UNCERTAIN',
}

export enum DataType {
  BOOLEAN = 'Boolean',
  INT8 = 'Int8',
  INT16 = 'Int16',
  INT32 = 'Int32',
  INT64 = 'Int64',
  UINT8 = 'UInt8',
  UINT16 = 'UInt16',
  UINT32 = 'UInt32',
  UINT64 = 'UInt64',
  FLOAT = 'Float',
  DOUBLE = 'Double',
  STRING = 'String',
  DATETIME = 'DateTime',
  BYTES = 'Bytes',
}

export interface DataPoint {
  address: string; // Protocol-specific address
  name: string; // Human-readable name
  value: unknown; // Actual value
  dataType: DataType;
  quality: DataQuality;
  timestamp: number; // Unix timestamp (ms)
  unit?: string;
  metadata?: Record<string, unknown>;
}

export interface BulkReadRequest {
  addresses: string[];
  timeout?: number;
}

export interface BulkReadResponse {
  dataPoints: Map<string, DataPoint>;
  errors: Map<string, Error>;
}

export interface DeviceDiscovery {
  deviceId: string;
  protocol: ProtocolType;
  address: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface SubscriptionOptions {
  sampleRate?: number; // Sampling interval (ms)
  deadband?: number; // Dead-band for filtering
  queueSize?: number; // Buffer size
}

export type DataCallback = (dataPoint: DataPoint) => void;
export type ErrorCallback = (error: Error) => void;

/**
 * Core Protocol Adapter Interface
 *
 * All protocol implementations must implement this interface.
 * Provides a unified way to interact with diverse industrial protocols.
 */
export interface IProtocolAdapter {
  /**
   * Get protocol capabilities
   */
  getCapabilities(): ProtocolCapabilities;

  /**
   * Establish connection to device/network
   */
  connect(config: ConnectionConfig): Promise<void>;

  /**
   * Disconnect from device/network
   */
  disconnect(): Promise<void>;

  /**
   * Check if adapter is currently connected
   */
  isConnected(): boolean;

  /**
   * Get current connection status
   */
  getConnectionState(): ConnectionState;

  /**
   * Read single data point
   */
  read(address: string): Promise<DataPoint>;

  /**
   * Read multiple data points in bulk (if supported)
   */
  readBulk(request: BulkReadRequest): Promise<BulkReadResponse>;

  /**
   * Write single data point
   */
  write(address: string, value: unknown): Promise<void>;

  /**
   * Subscribe to data point changes (if supported)
   */
  subscribe(
    addresses: string[],
    callback: DataCallback,
    errorCallback?: ErrorCallback,
    options?: SubscriptionOptions
  ): Promise<string>; // Returns subscription ID

  /**
   * Unsubscribe from data point changes
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Discover devices on network (if supported)
   */
  discoverDevices(): Promise<DeviceDiscovery[]>;

  /**
   * Browse available data points on device (if supported)
   */
  browseDataPoints(deviceId?: string): Promise<DataPoint[]>;

  /**
   * Get adapter health status
   */
  getHealth(): AdapterHealth;
}

export interface ConnectionState {
  status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';
  lastConnected?: number;
  lastDisconnected?: number;
  reconnectAttempts: number;
  error?: Error;
}

export interface AdapterHealth {
  isHealthy: boolean;
  uptime: number;
  totalReads: number;
  totalWrites: number;
  failedReads: number;
  failedWrites: number;
  avgReadLatency: number;
  avgWriteLatency: number;
  lastError?: Error;
}
