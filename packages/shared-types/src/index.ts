// Device Types
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  protocol: ProtocolType;
  connectionConfig: ConnectionConfig;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DeviceType {
  PLC = 'PLC',
  RTU = 'RTU',
  SENSOR = 'SENSOR',
  ACTUATOR = 'ACTUATOR',
  GATEWAY = 'GATEWAY',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ProtocolType {
  MODBUS_TCP = 'MODBUS_TCP',
  MODBUS_RTU = 'MODBUS_RTU',
  OPC_UA = 'OPC_UA',
  MQTT = 'MQTT',
  SNMP = 'SNMP',
}

// Tag Types
export interface Tag {
  id: string;
  deviceId: string;
  name: string;
  address: string;
  dataType: DataType;
  value: TagValue;
  quality: TagQuality;
  timestamp: Date;
  unit?: string;
  scalingFactor?: number;
  alarmConfig?: AlarmConfig;
}

export enum DataType {
  BOOLEAN = 'BOOLEAN',
  INT16 = 'INT16',
  INT32 = 'INT32',
  FLOAT = 'FLOAT',
  DOUBLE = 'DOUBLE',
  STRING = 'STRING',
}

export type TagValue = boolean | number | string | null;

export enum TagQuality {
  GOOD = 'GOOD',
  BAD = 'BAD',
  UNCERTAIN = 'UNCERTAIN',
}

// Alarm Types
export interface AlarmConfig {
  enabled: boolean;
  highHigh?: number;
  high?: number;
  low?: number;
  lowLow?: number;
  deadband?: number;
}

export interface Alarm {
  id: string;
  tagId: string;
  deviceId: string;
  severity: AlarmSeverity;
  message: string;
  value: TagValue;
  threshold?: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  timestamp: Date;
}

export enum AlarmSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// Connection Types
export interface ConnectionConfig {
  host: string;
  port: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  options?: Record<string, unknown>;
}

// Real-time Event Types
export enum EventType {
  TAG_UPDATE = 'TAG_UPDATE',
  DEVICE_STATUS = 'DEVICE_STATUS',
  ALARM_TRIGGERED = 'ALARM_TRIGGERED',
  ALARM_ACKNOWLEDGED = 'ALARM_ACKNOWLEDGED',
  CONNECTION_STATUS = 'CONNECTION_STATUS',
}

export interface TagUpdateEvent {
  type: EventType.TAG_UPDATE;
  payload: Tag;
}

export interface DeviceStatusEvent {
  type: EventType.DEVICE_STATUS;
  payload: {
    deviceId: string;
    status: DeviceStatus;
    timestamp: Date;
  };
}

export interface AlarmEvent {
  type: EventType.ALARM_TRIGGERED | EventType.ALARM_ACKNOWLEDGED;
  payload: Alarm;
}

export type ScadaEvent = TagUpdateEvent | DeviceStatusEvent | AlarmEvent;

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
  details?: Record<string, unknown>;
}

// Historical Data Types
export interface HistoricalDataQuery {
  tagIds: string[];
  startTime: Date;
  endTime: Date;
  aggregation?: AggregationType;
  interval?: number;
}

export enum AggregationType {
  RAW = 'RAW',
  AVERAGE = 'AVERAGE',
  MIN = 'MIN',
  MAX = 'MAX',
  SUM = 'SUM',
}

export interface HistoricalDataPoint {
  tagId: string;
  value: TagValue;
  quality: TagQuality;
  timestamp: Date;
}

// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
  ENGINEER = 'ENGINEER',
}

export enum Permission {
  READ_DEVICES = 'READ_DEVICES',
  WRITE_DEVICES = 'WRITE_DEVICES',
  READ_TAGS = 'READ_TAGS',
  WRITE_TAGS = 'WRITE_TAGS',
  ACKNOWLEDGE_ALARMS = 'ACKNOWLEDGE_ALARMS',
  MANAGE_USERS = 'MANAGE_USERS',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
}
