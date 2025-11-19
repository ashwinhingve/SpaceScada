/**
 * Entity type definitions for WebSCADA application
 * These types map IoT/LoRaWAN concepts to SCADA terminology
 */

// Base types
export type EntityStatus = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'PENDING';
export type DeviceType = 'plc' | 'sensor' | 'actuator' | 'gateway';
export type ProtocolType = 'modbus' | 'mqtt' | 'opcua';

// Project (formerly Application in IoT context)
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  deviceCount: number;
  status: EntityStatus;
  organizationId?: string;
  labels?: string[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  organizationId?: string;
  labels?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  labels?: string[];
}

// Organization (multi-tenancy support)
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
  deviceCount: number;
  memberCount: number;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
}

// Gateway (Protocol Gateway for SCADA devices)
export interface Gateway {
  id: string;
  name: string;
  eui?: string; // Equipment Unique Identifier (for LoRaWAN compatibility)
  protocol: ProtocolType;
  status: EntityStatus;
  frequencyPlan?: string; // For LoRaWAN gateways
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  networkSettings?: {
    requireAuth: boolean;
    publicStatus: boolean;
    publicLocation: boolean;
    packetBrokerForwarding: boolean;
    statusLocationUpdates: boolean;
    enforceDutyCycle: boolean;
  };
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  deviceCount: number;
  organizationId?: string;
}

export interface CreateGatewayInput {
  name: string;
  eui?: string;
  protocol: ProtocolType;
  frequencyPlan?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  networkSettings?: {
    requireAuth?: boolean;
    publicStatus?: boolean;
    publicLocation?: boolean;
    packetBrokerForwarding?: boolean;
    statusLocationUpdates?: boolean;
    enforceDutyCycle?: boolean;
  };
  organizationId?: string;
}

export interface UpdateGatewayInput {
  name?: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  networkSettings?: {
    requireAuth?: boolean;
    publicStatus?: boolean;
    publicLocation?: boolean;
    packetBrokerForwarding?: boolean;
    statusLocationUpdates?: boolean;
    enforceDutyCycle?: boolean;
  };
}

// SCADA Device (End Device in IoT context)
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  protocol: ProtocolType;
  status: EntityStatus;
  projectId?: string;
  gatewayId?: string;
  eui?: string; // Device EUI for LoRaWAN devices
  config?: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  tagCount: number;
  organizationId?: string;
}

export interface CreateDeviceInput {
  name: string;
  type: DeviceType;
  protocol: ProtocolType;
  projectId?: string;
  gatewayId?: string;
  eui?: string;
  config?: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  organizationId?: string;
}

export interface UpdateDeviceInput {
  name?: string;
  type?: DeviceType;
  protocol?: ProtocolType;
  projectId?: string;
  gatewayId?: string;
  config?: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

// API Key
export interface ApiKey {
  id: string;
  name: string;
  key: string; // Only shown once upon creation
  rights: ApiKeyRight[];
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  organizationId?: string;
  projectId?: string;
}

export type ApiKeyRight =
  | 'devices:read'
  | 'devices:write'
  | 'devices:delete'
  | 'tags:read'
  | 'tags:write'
  | 'projects:read'
  | 'projects:write'
  | 'projects:delete'
  | 'gateways:read'
  | 'gateways:write'
  | 'gateways:delete'
  | 'organizations:read'
  | 'organizations:write'
  | 'all';

export interface CreateApiKeyInput {
  name: string;
  rights: ApiKeyRight[];
  expiresAt?: Date;
  organizationId?: string;
  projectId?: string;
}

// Tag (Data Point) - extends the existing definition
export interface Tag {
  id: string;
  deviceId: string;
  name: string;
  dataType: 'number' | 'boolean' | 'string';
  value: any;
  unit?: string;
  timestamp: Date;
  address?: string; // Modbus address, MQTT topic, etc.
  readOnly?: boolean;
  alarmEnabled?: boolean;
  alarmThreshold?: {
    high?: number;
    low?: number;
  };
}

export interface CreateTagInput {
  deviceId: string;
  name: string;
  dataType: 'number' | 'boolean' | 'string';
  unit?: string;
  address?: string;
  readOnly?: boolean;
  alarmEnabled?: boolean;
  alarmThreshold?: {
    high?: number;
    low?: number;
  };
}

export interface UpdateTagInput {
  name?: string;
  unit?: string;
  address?: string;
  readOnly?: boolean;
  alarmEnabled?: boolean;
  alarmThreshold?: {
    high?: number;
    low?: number;
  };
}

// Alarm
export interface Alarm {
  id: string;
  deviceId: string;
  tagId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
  resolvedAt?: Date;
}

// Statistics and aggregated data
export interface EntityStats {
  total: number;
  online: number;
  offline: number;
  error: number;
}

export interface ProjectStats {
  projects: number;
  devices: number;
  gateways: number;
  tags: number;
  alarms: number;
}

// List response wrappers
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter and sort options
export interface ListFilters {
  search?: string;
  status?: EntityStatus;
  organizationId?: string;
  projectId?: string;
  type?: DeviceType;
  protocol?: ProtocolType;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface ListOptions {
  page?: number;
  limit?: number;
  filters?: ListFilters;
  sort?: SortOptions;
}
