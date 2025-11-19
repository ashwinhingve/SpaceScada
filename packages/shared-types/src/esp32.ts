/**
 * ESP32 Device Types
 * Types for ESP32-based IoT devices
 */

import { DeviceType, DeviceStatus, ConnectionStatus, CommandStatus } from './devices';

// ============================================
// ESP32 ENUMS
// ============================================

export enum ESP32SensorType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  PRESSURE = 'PRESSURE',
  LIGHT = 'LIGHT',
  MOTION = 'MOTION',
  GAS = 'GAS',
  VOLTAGE = 'VOLTAGE',
  CURRENT = 'CURRENT',
  CUSTOM = 'CUSTOM',
}

export enum ESP32Action {
  SET_OUTPUT = 'SET_OUTPUT',
  SET_LED = 'SET_LED',
  TOGGLE_LED = 'TOGGLE_LED',
  SET_RELAY = 'SET_RELAY',
  GET_STATUS = 'GET_STATUS',
  REQUEST_STATUS = 'REQUEST_STATUS',
  REBOOT = 'REBOOT',
  OTA_UPDATE = 'OTA_UPDATE',
  UPDATE_CONFIG = 'UPDATE_CONFIG',
  CALIBRATE = 'CALIBRATE',
  CUSTOM = 'CUSTOM',
}

export enum ESP32EventType {
  HEARTBEAT = 'HEARTBEAT',
  SENSOR_DATA = 'SENSOR_DATA',
  CONTROL_STATE = 'CONTROL_STATE',
  ALERT = 'ALERT',
  STATUS_UPDATE = 'STATUS_UPDATE',
  ERROR = 'ERROR',
}

// ============================================
// ESP32 DEVICE
// ============================================

export interface ESP32Device {
  id: string;
  device_id: string;
  name: string;
  description?: string;
  type: DeviceType.GSM_ESP32 | 'ESP32' | 'SENSOR';
  status: DeviceStatus;
  protocol?: string;
  tags?: string[];

  // Configuration
  config: {
    mqttClientId: string;
    mqttTopic: string;
    publishInterval: number;
    sensors: ESP32SensorConfig[];
  };

  esp32Config?: {
    mqttClientId: string;
    mqttTopic: string;
    publishInterval: number;
    sensors: ESP32SensorConfig[];
    [key: string]: any;
  };

  // Connection info
  connectionConfig?: {
    host: string;
    port: number;
    useSSL?: boolean;
  };

  gsmConfig?: {
    apn: string;
    username?: string;
    password?: string;
  };

  // Status
  connectionStatus?: ConnectionStatus;
  lastSeen?: Date;
  firmwareVersion?: string;
  ipAddress?: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface ESP32SensorConfig {
  id: string;
  type: ESP32SensorType;
  pin: number;
  enabled: boolean;
  minValue?: number;
  maxValue?: number;
  unit?: string;
}

// ============================================
// ESP32 SENSOR DATA
// ============================================

export interface ESP32SensorData {
  deviceId: string;
  sensorId?: string;
  sensorType?: ESP32SensorType;
  value?: number;
  unit?: string;
  quality?: 'GOOD' | 'BAD' | 'UNCERTAIN';
  temperature?: number;
  humidity?: number;
  pressure?: number;
  ledState?: boolean;
  customData?: Record<string, any>;
  timestamp: Date;
}

// ============================================
// ESP32 CONTROL
// ============================================

export interface ESP32ControlState {
  deviceId: string;
  outputs: {
    [pin: number]: boolean | number;
  };
  ledState?: boolean;
  mode?: string;
  timestamp: Date;
}

export interface ESP32ControlCommand {
  id: string;
  deviceId: string;
  action: ESP32Action;
  parameters?: Record<string, any>;
  ledState?: boolean;
  relayIndex?: number;
  relayState?: boolean;
  outputPin?: number;
  outputState?: boolean | number;
  customCommand?: string;
  status: CommandStatus;
  response?: any;
  sentAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ============================================
// ESP32 EVENTS
// ============================================

export interface ESP32HeartbeatPayload {
  deviceId: string;
  status: DeviceStatus | 'online' | 'offline';
  uptime: number;
  memoryFree?: number;
  freeHeap?: number;
  wifiRssi?: number;
  timestamp: Date;
}

export interface ESP32Event {
  type: ESP32EventType;
  deviceId: string;
  payload: any;
  timestamp: Date;
}
