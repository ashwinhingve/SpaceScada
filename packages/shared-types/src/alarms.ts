/**
 * Alarm System Types
 * IEC 62443 Compliant Alarm Management
 */

// ============================================
// ENUMS
// ============================================

export enum AlarmSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export enum AlarmStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  CLEARED = 'CLEARED',
}

export enum AlarmConditionType {
  HIGH_HIGH = 'HIGH_HIGH',
  HIGH = 'HIGH',
  LOW = 'LOW',
  LOW_LOW = 'LOW_LOW',
  DEVICE_OFFLINE = 'DEVICE_OFFLINE',
  COMMUNICATION_FAILURE = 'COMMUNICATION_FAILURE',
  SIGNAL_WEAK = 'SIGNAL_WEAK',
  BATTERY_LOW = 'BATTERY_LOW',
  CUSTOM = 'CUSTOM',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WEBHOOK = 'WEBHOOK',
  PUSH = 'PUSH',
  MQTT = 'MQTT',
}

// ============================================
// ALARM DEFINITION
// ============================================

export interface AlarmDefinition {
  id: string;
  device_id?: string; // Optional - can be global alarm

  // Configuration
  name: string;
  description?: string;
  severity: AlarmSeverity;

  // Condition
  tag_name?: string;
  condition_type: AlarmConditionType;
  threshold_value?: number;
  deadband?: number;

  // Complex condition (for advanced alarms)
  condition_expression?: string; // e.g., "(temp > 50 AND humidity < 30) OR pressure < 100"

  // Behavior
  enabled: boolean;
  require_acknowledgment: boolean;
  auto_clear: boolean;

  // Notifications
  notification_channels: NotificationConfig[];

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface NotificationConfig {
  channel: NotificationChannel;
  enabled: boolean;
  recipients: string[]; // emails, phone numbers, webhook URLs, etc.
  template?: string;
  metadata?: Record<string, any>;
}

// ============================================
// ACTIVE ALARM
// ============================================

export interface Alarm {
  id: string;
  alarm_definition_id?: string;
  device_id: string;

  // Alarm details
  severity: AlarmSeverity;
  status: AlarmStatus;
  message: string;

  // Values
  tag_name?: string;
  current_value?: number;
  threshold_value?: number;

  // Timing
  activated_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  cleared_at?: Date;

  // Acknowledgment
  acknowledged_by?: string;
  acknowledgment_note?: string;

  // Resolution
  resolution_note?: string;
  resolved_by?: string;

  // Metadata
  metadata?: Record<string, any>;

  // Notification tracking
  notifications_sent: NotificationLog[];

  created_at: Date;
}

export interface NotificationLog {
  channel: NotificationChannel;
  recipient: string;
  sent_at: Date;
  success: boolean;
  error_message?: string;
}

// ============================================
// ALARM EVENTS
// ============================================

export interface AlarmEvent {
  alarm_id: string;
  event_type: 'ACTIVATED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CLEARED' | 'ESCALATED';
  previous_status?: AlarmStatus;
  new_status: AlarmStatus;
  triggered_by?: string;
  note?: string;
  timestamp: Date;
}

// ============================================
// ALARM STATISTICS
// ============================================

export interface AlarmStatistics {
  total_active: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  by_device_type: {
    gsm_esp32: number;
    lorawan: number;
    standard_mqtt: number;
  };
  unacknowledged: number;
  average_resolution_time_minutes?: number;
}

// ============================================
// ALARM QUERY
// ============================================

export interface AlarmQuery {
  device_ids?: string[];
  severities?: AlarmSeverity[];
  statuses?: AlarmStatus[];
  start_time?: Date;
  end_time?: Date;
  limit?: number;
  offset?: number;
  sort_by?: 'activated_at' | 'severity' | 'status';
  sort_order?: 'asc' | 'desc';
}
