/**
 * Common types used across the application
 */

// ============================================================================
// Device Types
// ============================================================================

export type DeviceType = 'gsm' | 'wifi' | 'bluetooth' | 'lorawan';
export type DeviceStatus = 'online' | 'offline' | 'pending' | 'error';

// ============================================================================
// Base Device Interface
// ============================================================================

export interface BaseDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Filter Options
// ============================================================================

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

// ============================================================================
// Location
// ============================================================================

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: string;
}

// ============================================================================
// Metric Data
// ============================================================================

export interface MetricData {
  timestamp: string;
  value: number;
  unit?: string;
}

export interface MetricSeries {
  name: string;
  data: MetricData[];
  color?: string;
}

// ============================================================================
// Dashboard Metrics
// ============================================================================

export interface DashboardMetrics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  errorDevices: number;
  lastUpdated: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ============================================================================
// Loading State
// ============================================================================

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Form State
// ============================================================================

export interface FormState<T> extends LoadingState {
  data: T;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<keyof T, string | undefined>;
}
