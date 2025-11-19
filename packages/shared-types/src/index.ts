/**
 * WebSCADA Production Types
 * Central export for all type definitions
 * Supports: GSM ESP32, LoRaWAN, Standard MQTT
 */

// ============================================
// NEW PRODUCTION TYPES
// ============================================

// Device types (3 device types: GSM ESP32, LoRaWAN, Standard MQTT)
export * from './devices';

// Alarm types
export * from './alarms';

// API types
export * from './api';

// ESP32 types
export * from './esp32';

// ============================================
// LEGACY TYPES (Backward Compatibility)
// ============================================

// Keep old types for backward compatibility during migration
export interface ConnectionConfig {
  host: string;
  port: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  options?: Record<string, unknown>;
}

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

export interface AlarmConfig {
  enabled: boolean;
  highHigh?: number;
  high?: number;
  low?: number;
  lowLow?: number;
  deadband?: number;
}

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

export enum ProtocolType {
  MODBUS_TCP = 'MODBUS_TCP',
  MODBUS_RTU = 'MODBUS_RTU',
  OPC_UA = 'OPC_UA',
  MQTT = 'MQTT',
  SNMP = 'SNMP',
  GSM_HTTP = 'GSM_HTTP',
  GSM_MQTT = 'GSM_MQTT',
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

// ============================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================

// Device types re-export
export type {
  // Main device types
  Device,
  GSMDevice,
  LoRaWANDevice,
  StandardMQTTDevice,

  // Device configs
  GSMDeviceConfig,
  LoRaWANDeviceConfig,
  StandardMQTTDeviceConfig,

  // Telemetry
  TelemetryDataPoint,
  TelemetryBatch,
  TelemetryTag,

  // Commands
  DeviceCommand,

  // GSM Protocol Adapter types
  GSMConfig,
  GSMNetworkStatus,
  GPSLocation,
  SMSMessage,
  SendSMSRequest,
  SendSMSResponse,
  GSMCommand,
} from './devices';

export {
  // Device enums
  DeviceType,
  DeviceStatus,
  ConnectionStatus,
  LoRaWANActivation,
  NetworkType,
  PowerMode,
  CommandStatus as DeviceCommandStatus,
  CommandType,

  // GSM Protocol Adapter enums
  SignalQuality,
  SIMStatus,
  SMSStatus,
  SMSDirection,
  GPSFixType,

  // Type guards
  isGSMDevice,
  isLoRaWANDevice,
  isStandardMQTTDevice,
} from './devices';

// Alarm types re-export
export type { Alarm, AlarmDefinition, AlarmStatistics } from './alarms';

export { AlarmSeverity, AlarmStatus, AlarmConditionType, NotificationChannel } from './alarms';

// API types re-export
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  WebSocketMessage,
  DashboardSummary,
  SparkplugBPayload,
  SparkplugBMetric,
} from './api';

export { WebSocketMessageType, SparkplugBDataType } from './api';
