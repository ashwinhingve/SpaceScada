/**
 * Production-grade WebSCADA Device Types
 * Supports: GSM ESP32, LoRaWAN, Standard MQTT
 * IEC 62443 Compliant
 */

// ============================================
// ENUMS
// ============================================

export enum DeviceType {
  GSM_ESP32 = 'GSM_ESP32',
  LORAWAN = 'LORAWAN',
  STANDARD_MQTT = 'STANDARD_MQTT',
  ESP32 = 'ESP32',
  SENSOR = 'SENSOR',
  WIFI = 'WIFI',
  BLUETOOTH = 'BLUETOOTH',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  PROVISIONING = 'PROVISIONING',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
}

export enum LoRaWANActivation {
  OTAA = 'OTAA',
  ABP = 'ABP',
}

export enum LoRaWANDeviceClass {
  CLASS_A = 'A',
  CLASS_B = 'B',
  CLASS_C = 'C',
}

export enum NetworkType {
  GSM_2G = '2G',
  UMTS_3G = '3G',
  LTE_4G = '4G',
  NB_IOT = 'NB-IoT',
  LTE_M = 'LTE-M',
}

export enum PowerMode {
  NORMAL = 'NORMAL',
  LOW_POWER = 'LOW_POWER',
  DEEP_SLEEP = 'DEEP_SLEEP',
}

export enum DataType {
  FLOAT = 'FLOAT',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  STRING = 'STRING',
  JSON = 'JSON',
}

export enum WiFiChipset {
  ESP32 = 'ESP32',
  ESP8266 = 'ESP8266',
  ESP32_C3 = 'ESP32-C3',
  ESP32_S2 = 'ESP32-S2',
  ESP32_S3 = 'ESP32-S3',
  OTHER = 'OTHER',
}

export enum BluetoothProtocol {
  BLE = 'BLE',
  CLASSIC = 'Classic',
}

// ============================================
// BASE INTERFACES
// ============================================

/**
 * Base device interface (common to all device types)
 */
export interface BaseDevice {
  id: string; // UUID
  device_id: string; // User-friendly ID
  name: string;
  description?: string;
  device_type: DeviceType;
  status: DeviceStatus;

  // Location
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    location_name?: string;
  };

  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_seen?: Date;

  // Audit
  created_by?: string;
  updated_by?: string;
}

/**
 * Connection configuration base
 */
export interface ConnectionConfig {
  host: string;
  port: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  use_tls?: boolean;
  options?: Record<string, unknown>;
}

// ============================================
// GSM ESP32 DEVICE
// ============================================

export interface GSMDeviceConfig {
  // Hardware identifiers
  imei: string; // 15 digits
  iccid?: string; // SIM card ID
  imsi?: string; // International Mobile Subscriber Identity

  // Network configuration
  apn: string;
  apn_username?: string;
  apn_password?: string; // Encrypted in storage

  // MQTT configuration
  mqtt_client_id: string;
  mqtt_username?: string;
  mqtt_password?: string; // Encrypted
  mqtt_broker_host: string;
  mqtt_broker_port: number;
  mqtt_use_tls: boolean;
  mqtt_topic_prefix: string;

  // GSM modem info
  modem_model?: string;
  firmware_version?: string;

  // Configuration
  publish_interval: number; // milliseconds
  heartbeat_interval: number; // milliseconds
  enable_ota: boolean;
}

export interface GSMDeviceStatus {
  // Signal monitoring
  signal_strength?: number; // RSSI in dBm
  signal_quality?: number; // 0-100
  network_type?: NetworkType;
  operator?: string;

  // Power
  battery_voltage?: number;
  battery_percentage?: number;
  power_mode?: PowerMode;

  // Connection
  connection_status: ConnectionStatus;
  connected_at?: Date;
  last_heartbeat?: Date;

  // Data transfer
  bytes_sent?: number;
  bytes_received?: number;
  messages_sent?: number;
  messages_received?: number;
}

export interface GSMDevice extends BaseDevice {
  device_type: DeviceType.GSM_ESP32;
  config: GSMDeviceConfig;
  gsmConfig?: GSMDeviceConfig; // Alias for backward compatibility
  connectionConfig?: ConnectionConfig;
  type?: string; // Additional type field
  protocol?: string; // Protocol type
  status_info?: GSMDeviceStatus;
}

// ============================================
// GSM PROTOCOL ADAPTER TYPES
// ============================================

// Type alias for compatibility with protocol adapter
export type GSMConfig = GSMDeviceConfig;

export enum SignalQuality {
  NO_SIGNAL = 'NO_SIGNAL',
  POOR = 'POOR',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT',
}

export enum SIMStatus {
  READY = 'READY',
  NOT_READY = 'NOT_READY',
  LOCKED = 'LOCKED',
  ERROR = 'ERROR',
}

export enum SMSStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
}

export enum SMSDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum GPSFixType {
  NO_FIX = 'NO_FIX',
  FIX_2D = 'FIX_2D',
  FIX_3D = 'FIX_3D',
}

export interface GSMNetworkStatus {
  operator?: string;
  signalStrength: number; // 0-100
  signalQuality: SignalQuality;
  networkType: string; // '2G', '3G', '4G', 'LTE_CAT1', etc.
  registered: boolean;
  roaming: boolean;
  imei: string;
  iccid: string;
  simStatus: SIMStatus;
  ipAddress?: string;
  dataUsage?: {
    sent: number;
    received: number;
  };
  timestamp: Date;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number; // km/h
  heading?: number; // degrees 0-360
  satellites?: number;
  hdop?: number;
  accuracy?: number; // meters
  fix: GPSFixType;
  timestamp: Date;
}

export interface SMSMessage {
  id: string;
  deviceId: string;
  direction: SMSDirection;
  phoneNumber: string;
  message: string;
  status: SMSStatus;
  timestamp: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}

export interface SendSMSRequest {
  phoneNumber: string;
  message: string;
}

export interface SendSMSResponse {
  messageId: string;
  status: SMSStatus;
  timestamp: Date;
  errorMessage?: string;
}

export interface GSMCommand {
  id?: string;
  deviceId?: string;
  type?: 'AT' | 'HTTP' | 'MQTT' | 'SMS' | 'CUSTOM';
  command: string;
  parameters?: Record<string, any>;
  timeout?: number;
  response?: any;
  status?: CommandStatus;
  sentAt?: Date;
  completedAt?: Date;
  error?: string;
}

// ============================================
// LORAWAN DEVICE
// ============================================

export interface LoRaWANDeviceConfig {
  // LoRaWAN identifiers
  dev_eui: string; // 16 hex characters
  app_eui: string; // 16 hex characters
  app_key?: string; // 32 hex characters (OTAA only, encrypted)

  // Network session (for ABP or after OTAA join)
  dev_addr?: string; // 8 hex characters
  nwk_s_key?: string; // 32 hex (encrypted)
  app_s_key?: string; // 32 hex (encrypted)

  // Activation
  activation_mode: LoRaWANActivation;
  device_class: LoRaWANDeviceClass;

  // LoRaWAN parameters
  spreading_factor: number; // 7-12
  bandwidth: number; // 125, 250, or 500 kHz
  coding_rate: string; // '4/5', '4/6', '4/7', '4/8'
  frequency_plan: string; // EU868, US915, etc.

  // ChirpStack integration
  chirpstack_application_id: string;
  chirpstack_device_profile_id?: string;

  // Payload decoder
  decoder_name?: string;
  decoder_script?: string;

  // Configuration
  confirmed_uplinks: boolean;
  rx_delay: number; // seconds
  rx1_dr_offset: number;
  rx2_dr: number;
  rx2_frequency?: number;
}

export interface LoRaWANDeviceStatus {
  // Join status
  joined: boolean;
  join_time?: Date;

  // Link quality
  rssi?: number; // dBm
  snr?: number; // dB
  gateway_count?: number;

  // Frame counters
  uplink_frame_count: number;
  downlink_frame_count: number;

  // Activity
  last_uplink?: Date;
  last_downlink?: Date;

  // Connection
  connection_status: ConnectionStatus;
}

export interface LoRaWANDevice extends BaseDevice {
  device_type: DeviceType.LORAWAN;
  config: LoRaWANDeviceConfig;
  status_info?: LoRaWANDeviceStatus;
}

// ============================================
// STANDARD MQTT DEVICE
// ============================================

export interface StandardMQTTDeviceConfig {
  // MQTT configuration
  client_id: string;
  username?: string;
  password?: string; // Encrypted

  // Connection
  broker_host: string;
  broker_port: number;
  use_tls: boolean;
  clean_session: boolean;
  keep_alive: number; // seconds

  // Sparkplug B configuration
  use_sparkplug_b: boolean;
  group_id?: string;
  edge_node_id?: string;

  // Topics
  publish_topics: string[];
  subscribe_topics: string[];

  // QoS settings
  default_qos: 0 | 1 | 2;

  // Last will testament
  lwt_topic?: string;
  lwt_payload?: string;
  lwt_qos?: 0 | 1 | 2;
  lwt_retain?: boolean;

  // Capabilities
  supports_commands: boolean;
  supports_ota: boolean;
}

export interface StandardMQTTDeviceStatus {
  // Connection
  connection_status: ConnectionStatus;
  connected_at?: Date;
  disconnected_at?: Date;

  // Session
  session_present?: boolean;
  client_connected?: boolean;

  // Data transfer
  messages_sent?: number;
  messages_received?: number;
  last_message_at?: Date;
}

export interface StandardMQTTDevice extends BaseDevice {
  device_type: DeviceType.STANDARD_MQTT;
  config: StandardMQTTDeviceConfig;
  status_info?: StandardMQTTDeviceStatus;
}

// ============================================
// WI-FI DEVICE
// ============================================

export interface WiFiDeviceConfig {
  // Wi-Fi hardware identifiers
  mac_address: string; // MAC address (AA:BB:CC:DD:EE:FF)

  // Network configuration
  ssid: string; // Wi-Fi network SSID
  password?: string; // Wi-Fi password (encrypted in storage)

  // Device configuration
  chipset: WiFiChipset;
  firmware_version?: string;
  hardware_version?: string;

  // IP configuration
  use_dhcp: boolean;
  static_ip?: string;
  gateway?: string;
  subnet_mask?: string;
  dns_primary?: string;
  dns_secondary?: string;

  // MQTT configuration (if device uses MQTT)
  mqtt_enabled?: boolean;
  mqtt_broker_host?: string;
  mqtt_broker_port?: number;
  mqtt_client_id?: string;
  mqtt_username?: string;
  mqtt_password?: string; // Encrypted
  mqtt_use_tls?: boolean;

  // Configuration
  publish_interval?: number; // milliseconds
  heartbeat_interval?: number; // milliseconds
  enable_ota?: boolean;
}

export interface WiFiDeviceStatus {
  // Connection status
  connection_status: ConnectionStatus;
  connected_at?: Date;

  // Network info
  ssid?: string;
  ip_address?: string;
  signal_strength?: number; // 0-100 (RSSI mapped to percentage)
  channel?: number;

  // Performance
  bandwidth_usage?: number; // bytes/sec
  packet_loss?: number; // percentage
  latency?: number; // milliseconds

  // Data transfer
  bytes_sent?: number;
  bytes_received?: number;
  messages_sent?: number;
  messages_received?: number;
}

export interface WiFiDevice extends BaseDevice {
  device_type: DeviceType.WIFI;
  config: WiFiDeviceConfig;
  status_info?: WiFiDeviceStatus;
}

// ============================================
// BLUETOOTH DEVICE
// ============================================

export interface BluetoothDeviceConfig {
  // Bluetooth hardware identifiers
  mac_address: string; // MAC address (AA:BB:CC:DD:EE:FF)

  // Bluetooth configuration
  protocol: BluetoothProtocol;
  device_name?: string;

  // BLE specific configuration
  service_uuids?: string[]; // GATT service UUIDs
  characteristic_uuids?: string[]; // GATT characteristic UUIDs

  // Device info
  firmware_version?: string;
  hardware_version?: string;
  manufacturer?: string;
  model_number?: string;

  // Power configuration
  advertising_interval?: number; // milliseconds (BLE)
  connection_interval?: number; // milliseconds
  tx_power?: number; // dBm

  // Configuration
  enable_notifications?: boolean;
  enable_indications?: boolean;
  enable_ota?: boolean;
}

export interface BluetoothDeviceStatus {
  // Connection status
  connection_status: ConnectionStatus;
  connected_at?: Date;

  // Signal info
  signal_strength?: number; // 0-100 (RSSI mapped to percentage)
  rssi?: number; // Raw RSSI in dBm

  // Power
  battery_level?: number; // 0-100 percentage
  battery_voltage?: number; // Volts

  // BLE specific
  advertising?: boolean;
  bonded?: boolean;
  encrypted?: boolean;

  // Proximity
  distance_estimate?: number; // meters (calculated from RSSI)
  proximity_zone?: 'immediate' | 'near' | 'far' | 'unknown';

  // Data transfer
  notifications_received?: number;
  indications_received?: number;
  writes_sent?: number;
}

export interface BluetoothDevice extends BaseDevice {
  device_type: DeviceType.BLUETOOTH;
  config: BluetoothDeviceConfig;
  status_info?: BluetoothDeviceStatus;
}

// ============================================
// UNION TYPES
// ============================================

export type Device = GSMDevice | LoRaWANDevice | StandardMQTTDevice | WiFiDevice | BluetoothDevice;

export type DeviceConfig = GSMDeviceConfig | LoRaWANDeviceConfig | StandardMQTTDeviceConfig | WiFiDeviceConfig | BluetoothDeviceConfig;

export type DeviceStatusInfo = GSMDeviceStatus | LoRaWANDeviceStatus | StandardMQTTDeviceStatus | WiFiDeviceStatus | BluetoothDeviceStatus;

// ============================================
// TELEMETRY
// ============================================

export interface TelemetryTag {
  id: string;
  device_id: string;
  tag_name: string;
  tag_alias?: string;
  data_type: DataType;
  unit?: string;

  // Measurement mapping (InfluxDB)
  measurement_name: string;
  field_name: string;

  // Validation
  min_value?: number;
  max_value?: number;
  enum_values?: string[];

  // Scaling
  scale_factor: number;
  offset: number;

  // Alarming
  enable_alarms: boolean;
  alarm_high_high?: number;
  alarm_high?: number;
  alarm_low?: number;
  alarm_low_low?: number;
  alarm_deadband?: number;

  // Metadata
  description?: string;
  metadata?: Record<string, any>;

  created_at: Date;
  updated_at: Date;
}

export interface TelemetryDataPoint {
  device_id: string;
  device_type: DeviceType;
  tag_name: string;
  value: number | string | boolean | null;
  quality: 'good' | 'bad' | 'uncertain';
  unit?: string;
  timestamp: Date;
}

export interface TelemetryBatch {
  device_id: string;
  device_type: DeviceType;
  data_points: TelemetryDataPoint[];
  metadata?: Record<string, any>;
  received_at: Date;
}

// ============================================
// COMMANDS
// ============================================

export enum CommandStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  EXECUTED = 'EXECUTED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export enum CommandType {
  // GSM ESP32 commands
  GSM_REBOOT = 'GSM_REBOOT',
  GSM_UPDATE_CONFIG = 'GSM_UPDATE_CONFIG',
  GSM_OTA_UPDATE = 'GSM_OTA_UPDATE',
  GSM_SET_OUTPUT = 'GSM_SET_OUTPUT',
  GSM_READ_INPUT = 'GSM_READ_INPUT',

  // LoRaWAN commands
  LORAWAN_REBOOT = 'LORAWAN_REBOOT',
  LORAWAN_UPDATE_CONFIG = 'LORAWAN_UPDATE_CONFIG',
  LORAWAN_SET_OUTPUT = 'LORAWAN_SET_OUTPUT',

  // MQTT commands
  MQTT_PUBLISH = 'MQTT_PUBLISH',
  MQTT_SUBSCRIBE = 'MQTT_SUBSCRIBE',
  MQTT_UNSUBSCRIBE = 'MQTT_UNSUBSCRIBE',

  // Generic commands
  REQUEST_STATUS = 'REQUEST_STATUS',
  CUSTOM = 'CUSTOM',
}

export interface DeviceCommand {
  id: string;
  device_id: string;
  command_type: CommandType;
  command_payload: Record<string, any>;

  // Status
  status: CommandStatus;

  // Timing
  created_at: Date;
  sent_at?: Date;
  delivered_at?: Date;
  executed_at?: Date;
  timeout_at?: Date;

  // Response
  response_payload?: Record<string, any>;
  error_message?: string;

  // Metadata
  priority: number; // 1-10
  retry_count: number;
  max_retries: number;
  created_by?: string;
}

// ============================================
// LOCATIONS (GPS Tracking)
// ============================================

export interface DeviceLocation {
  id: string;
  device_id: string;

  // Location
  latitude: number;
  longitude: number;
  altitude?: number;

  // Accuracy
  accuracy?: number; // meters
  satellites?: number;
  hdop?: number;

  // Movement
  speed?: number; // km/h
  heading?: number; // degrees 0-360

  // Timestamp
  timestamp: Date;
  created_at: Date;
}

// ============================================
// CONNECTION HISTORY
// ============================================

export interface DeviceConnection {
  id: string;
  device_id: string;

  // Connection details
  connection_status: ConnectionStatus;
  connected_at?: Date;
  disconnected_at?: Date;
  duration_seconds?: number;

  // Network info
  ip_address?: string;
  port?: number;
  protocol?: string;

  // Disconnect reason
  disconnect_reason?: string;
  disconnect_code?: number;

  // Session info
  session_id?: string;
  bytes_sent: number;
  bytes_received: number;
  messages_sent: number;
  messages_received: number;

  created_at: Date;
}

// ============================================
// DEVICE REGISTRATION
// ============================================

export interface GSMDeviceRegistration {
  name: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    location_name?: string;
  };
  config: Omit<GSMDeviceConfig, 'mqtt_client_id'>; // Auto-generated
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface LoRaWANDeviceRegistration {
  name: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    location_name?: string;
  };
  config: LoRaWANDeviceConfig;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface StandardMQTTDeviceRegistration {
  name: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    location_name?: string;
  };
  config: StandardMQTTDeviceConfig;
  tags?: string[];
  metadata?: Record<string, any>;
}

export type DeviceRegistration =
  | GSMDeviceRegistration
  | LoRaWANDeviceRegistration
  | StandardMQTTDeviceRegistration;

// ============================================
// TYPE GUARDS
// ============================================

export function isGSMDevice(device: Device): device is GSMDevice {
  return device.device_type === DeviceType.GSM_ESP32;
}

export function isLoRaWANDevice(device: Device): device is LoRaWANDevice {
  return device.device_type === DeviceType.LORAWAN;
}

export function isStandardMQTTDevice(device: Device): device is StandardMQTTDevice {
  return device.device_type === DeviceType.STANDARD_MQTT;
}

export function isWiFiDevice(device: Device): device is WiFiDevice {
  return device.device_type === DeviceType.WIFI;
}

export function isBluetoothDevice(device: Device): device is BluetoothDevice {
  return device.device_type === DeviceType.BLUETOOTH;
}

// ============================================
// EVENTS
// ============================================

export enum GSMEventType {
  DEVICE_ONLINE = 'DEVICE_ONLINE',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  SENSOR_DATA = 'SENSOR_DATA',
  SMS_RECEIVED = 'SMS_RECEIVED',
  SMS_SENT = 'SMS_SENT',
  LOCATION_UPDATE = 'LOCATION_UPDATE',
  GPS_UPDATE = 'GPS_UPDATE',
  NETWORK_STATUS = 'NETWORK_STATUS',
  NETWORK_STATUS_UPDATE = 'NETWORK_STATUS_UPDATE',
  COMMAND_EXECUTED = 'COMMAND_EXECUTED',
  COMMAND_RESPONSE = 'COMMAND_RESPONSE',
  ERROR = 'ERROR',
}

export interface GSMEvent {
  type: GSMEventType;
  deviceId: string;
  payload: any;
  timestamp: Date;
}

export interface ScadaEvent {
  type: string;
  deviceId?: string;
  payload: any;
  timestamp: Date;
  source?: string;
}
