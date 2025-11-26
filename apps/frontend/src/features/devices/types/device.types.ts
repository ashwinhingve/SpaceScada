/**
 * Device Types - Unified abstraction for all device protocols
 */

export type DeviceProtocol = 'lorawan' | 'gsm' | 'esp32' | 'bluetooth';
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

/**
 * Base Device Interface
 * All protocol-specific devices extend this
 */
export interface BaseDevice {
  id: string;
  name: string;
  protocol: DeviceProtocol;
  status: DeviceStatus;
  connectionStatus: ConnectionStatus;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  location?: DeviceLocation;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  address?: string;
}

/**
 * Device Metrics (Real-time data)
 */
export interface DeviceMetrics {
  timestamp: Date;
  values: Record<string, MetricValue>;
}

export interface MetricValue {
  value: number | string | boolean;
  unit?: string;
  timestamp: Date;
}

/**
 * LoRaWAN Device
 */
export interface LoRaWANDevice extends BaseDevice {
  protocol: 'lorawan';
  lorawan: LoRaWANConfig;
  metrics: LoRaWANMetrics;
}

export interface LoRaWANConfig {
  devEUI: string;
  appEUI: string;
  appKey?: string;
  devAddr?: string;
  nwkSKey?: string;
  appSKey?: string;
  activationType: 'OTAA' | 'ABP';
  dataRate: number;
  frequency: number;
  rssi?: number;
  snr?: number;
}

export interface LoRaWANMetrics extends DeviceMetrics {
  frameCount: number;
  dataRate: number;
  rssi: number;
  snr: number;
}

/**
 * GSM Device
 */
export interface GSMDevice extends BaseDevice {
  protocol: 'gsm';
  gsm: GSMConfig;
  metrics: GSMMetrics;
}

export interface GSMConfig {
  imei: string;
  iccid: string;
  phoneNumber?: string;
  apn: string;
  operator?: string;
  networkType?: '2G' | '3G' | '4G' | '5G';
  signalStrength?: number;
}

export interface GSMMetrics extends DeviceMetrics {
  signalStrength: number;
  networkType: string;
  dataUsage: {
    sent: number;
    received: number;
  };
  gpsLocation?: DeviceLocation;
}

/**
 * ESP32 Device (Wi-Fi)
 */
export interface ESP32Device extends BaseDevice {
  protocol: 'esp32';
  esp32: ESP32Config;
  metrics: ESP32Metrics;
}

export interface ESP32Config {
  macAddress: string;
  ipAddress?: string;
  ssid?: string;
  rssi?: number;
  firmwareVersion?: string;
  chipModel: string;
  sensorType?: ESP32SensorType;
}

export type ESP32SensorType =
  | 'DHT11'
  | 'DHT22'
  | 'BMP280'
  | 'BME280'
  | 'DS18B20'
  | 'CUSTOM';

export interface ESP32Metrics extends DeviceMetrics {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  wifiStrength: number;
  uptime: number;
  freeHeap: number;
}

/**
 * Bluetooth Device
 */
export interface BluetoothDevice extends BaseDevice {
  protocol: 'bluetooth';
  bluetooth: BluetoothConfig;
  metrics: BluetoothMetrics;
}

export interface BluetoothConfig {
  macAddress: string;
  deviceClass?: string;
  rssi?: number;
  batteryLevel?: number;
  firmwareVersion?: string;
  serviceUUIDs?: string[];
}

export interface BluetoothMetrics extends DeviceMetrics {
  rssi: number;
  batteryLevel?: number;
  connectionQuality: number;
}

/**
 * Union type for all devices
 */
export type Device = LoRaWANDevice | GSMDevice | ESP32Device | BluetoothDevice;

/**
 * Device Control Actions
 */
export interface DeviceControlAction {
  deviceId: string;
  action: string;
  parameters?: Record<string, any>;
  timestamp: Date;
}

/**
 * Device Filters
 */
export interface DeviceFilters {
  protocol?: DeviceProtocol[];
  status?: DeviceStatus[];
  tags?: string[];
  search?: string;
}

/**
 * Device Sort Options
 */
export type DeviceSortField = 'name' | 'status' | 'lastSeen' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface DeviceSort {
  field: DeviceSortField;
  direction: SortDirection;
}

/**
 * Device List Response
 */
export interface DeviceListResponse {
  devices: Device[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Create Device DTOs
 */
export type CreateDeviceDto =
  | CreateLoRaWANDeviceDto
  | CreateGSMDeviceDto
  | CreateESP32DeviceDto
  | CreateBluetoothDeviceDto;

export interface CreateLoRaWANDeviceDto {
  name: string;
  protocol: 'lorawan';
  lorawan: Omit<LoRaWANConfig, 'rssi' | 'snr'>;
  location?: DeviceLocation;
  tags?: string[];
}

export interface CreateGSMDeviceDto {
  name: string;
  protocol: 'gsm';
  gsm: Omit<GSMConfig, 'signalStrength'>;
  location?: DeviceLocation;
  tags?: string[];
}

export interface CreateESP32DeviceDto {
  name: string;
  protocol: 'esp32';
  esp32: Omit<ESP32Config, 'ipAddress' | 'rssi'>;
  location?: DeviceLocation;
  tags?: string[];
}

export interface CreateBluetoothDeviceDto {
  name: string;
  protocol: 'bluetooth';
  bluetooth: Omit<BluetoothConfig, 'rssi' | 'batteryLevel'>;
  location?: DeviceLocation;
  tags?: string[];
}
