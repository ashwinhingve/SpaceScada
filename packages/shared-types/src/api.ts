/**
 * API Types - Request/Response Interfaces
 * RESTful API with WebSocket support
 */

// ============================================
// STANDARD API RESPONSE
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string; // Only in development
}

export interface ApiMetadata {
  request_id?: string;
  execution_time_ms?: number;
  pagination?: PaginationMetadata;
}

export interface PaginationMetadata {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginatedRequest {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMetadata;
}

// ============================================
// QUERY FILTERS
// ============================================

export interface DeviceListQuery extends PaginatedRequest {
  device_type?: string;
  status?: string;
  search?: string;
  tags?: string[];
  location_bounds?: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
}

export interface TelemetryQuery {
  device_id: string;
  tags?: string[];
  start_time: Date;
  end_time: Date;
  aggregation?: 'raw' | 'mean' | 'min' | 'max' | 'sum';
  interval?: string; // e.g., '1m', '5m', '1h'
  limit?: number;
}

// ============================================
// WEBSOCKET MESSAGES
// ============================================

export enum WebSocketMessageType {
  // Connection
  CONNECT = 'CONNECT',
  DISCONNECT = 'DISCONNECT',
  PING = 'PING',
  PONG = 'PONG',

  // Subscriptions
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',

  // Data streams
  TELEMETRY_DATA = 'TELEMETRY_DATA',
  DEVICE_STATUS = 'DEVICE_STATUS',
  ALARM_EVENT = 'ALARM_EVENT',
  COMMAND_STATUS = 'COMMAND_STATUS',

  // Errors
  ERROR = 'ERROR',
}

export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: Date;
  request_id?: string;
}

export interface SubscriptionRequest {
  device_ids?: string[];
  tag_names?: string[];
  event_types?: string[];
}

// ============================================
// ANALYTICS
// ============================================

export interface DashboardSummary {
  total_devices: number;
  devices_by_type: {
    gsm_esp32: number;
    lorawan: number;
    standard_mqtt: number;
  };
  devices_by_status: {
    online: number;
    offline: number;
    error: number;
  };
  active_alarms: number;
  alarms_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  data_points_24h: number;
  messages_per_second: number;
}

export interface DeviceHealthMetrics {
  device_id: string;
  uptime_percentage: number;
  message_count_24h: number;
  error_count_24h: number;
  average_latency_ms: number;
  last_communication: Date;
}

// ============================================
// AUTHENTICATION
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
  mfa_code?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ============================================
// SPARKPLUG B
// ============================================

export interface SparkplugBMetric {
  name: string;
  timestamp: number;
  dataType: number;
  value: any;
  properties?: Record<string, any>;
}

export interface SparkplugBPayload {
  timestamp: number;
  metrics: SparkplugBMetric[];
  seq: number;
}

export enum SparkplugBDataType {
  Int8 = 1,
  Int16 = 2,
  Int32 = 3,
  Int64 = 4,
  UInt8 = 5,
  UInt16 = 6,
  UInt32 = 7,
  UInt64 = 8,
  Float = 9,
  Double = 10,
  Boolean = 11,
  String = 12,
  DateTime = 13,
  Text = 14,
}
