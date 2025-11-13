// Device Types
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location?: string;
  tags: DeviceTag[];
  lastUpdate: Date;
}

export enum DeviceType {
  TEMPERATURE_SENSOR = 'TEMPERATURE_SENSOR',
  PRESSURE_SENSOR = 'PRESSURE_SENSOR',
  PUMP = 'PUMP',
  VALVE = 'VALVE',
  FLOW_METER = 'FLOW_METER',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
}

// Tag Types
export interface DeviceTag {
  id: string;
  deviceId: string;
  name: string;
  dataType: DataType;
  unit?: string;
  value: TagValue;
  quality: TagQuality;
  timestamp: Date;
}

export enum DataType {
  FLOAT = 'FLOAT',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
}

export type TagValue = number | boolean | string | null;

export enum TagQuality {
  GOOD = 'GOOD',
  BAD = 'BAD',
  UNCERTAIN = 'UNCERTAIN',
}

// Data Point for History
export interface DataPoint {
  tagId: string;
  value: TagValue;
  quality: TagQuality;
  timestamp: Date;
}

// Simulation Configuration
export interface SimulationConfig {
  type: SimulationType;
  min?: number;
  max?: number;
  frequency?: number;
  step?: number;
  toggleProbability?: number;
}

export enum SimulationType {
  SINE_WAVE = 'SINE_WAVE',
  RANDOM = 'RANDOM',
  BOOLEAN_TOGGLE = 'BOOLEAN_TOGGLE',
  RAMP = 'RAMP',
}

// WebSocket Event Types
export enum WebSocketEvent {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  DATA_UPDATE = 'data:update',
  DEVICE_STATUS = 'device:status',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat',
  PONG = 'pong',
}

export interface SubscribePayload {
  deviceIds: string[];
}

export interface UnsubscribePayload {
  deviceIds: string[];
}

export interface DataUpdatePayload {
  deviceId: string;
  tags: DeviceTag[];
  timestamp: Date;
}

export interface DeviceStatusPayload {
  deviceId: string;
  status: DeviceStatus;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Health Check Response
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  connections: {
    total: number;
    byRoom: Record<string, number>;
  };
  timestamp: Date;
}

// Metrics
export interface Metrics {
  httpRequestsTotal: number;
  websocketConnectionsCurrent: number;
  dataPointsGenerated: number;
  websocketMessagesSent: number;
}

// Connection Info
export interface ConnectionInfo {
  id: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  subscribedDevices: Set<string>;
}
