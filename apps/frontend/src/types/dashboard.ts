/**
 * Dashboard Widget Types
 * Type definitions for customizable dashboard widgets
 */

import { Layout } from 'react-grid-layout';

// ============================================
// CONNECTION STATUS
// ============================================

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
}

// ============================================
// DATA TYPES
// ============================================

export interface DeviceTag {
  id: string;
  deviceId: string;
  name: string;
  dataType: 'number' | 'boolean' | 'string' | 'FLOAT' | 'INTEGER' | 'BOOLEAN';
  unit?: string;
  value: number | boolean | string;
  quality?: 'GOOD' | 'BAD' | 'UNCERTAIN';
  timestamp: Date;
}

export interface DataPoint {
  tagId?: string;
  value: number | boolean | string;
  timestamp: Date;
  quality?: 'GOOD' | 'BAD' | 'UNCERTAIN';
}

export interface DeviceData {
  id: string;
  name: string;
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'online' | 'offline' | 'error';
  type?: string;
  location?: string;
  lastUpdate?: string;
  tags?: Array<{ id: string; name: string }>;
}

// ============================================
// WEBSOCKET PAYLOAD TYPES
// ============================================

export interface DataUpdatePayload {
  deviceId: string;
  tags: DeviceTag[];
}

export interface DeviceStatusPayload {
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'online' | 'offline' | 'error';
}

// ============================================
// DASHBOARD STATE
// ============================================

export interface DashboardState {
  // Connection state
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;

  // Device state
  devices: Map<string, DeviceData>;
  selectedDeviceId: string | null;

  // History
  tagHistory: Map<string, DataPoint[]>;

  // Connection actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // Device actions
  setDevices: (devices: DeviceData[]) => void;
  updateDevice: (device: DeviceData) => void;
  updateDeviceTags: (deviceId: string, tags: DeviceTag[]) => void;
  updateDeviceStatus: (deviceId: string, status: string) => void;
  setSelectedDevice: (deviceId: string | null) => void;

  // History actions
  addDataPoint: (tagId: string, dataPoint: DataPoint) => void;
  getTagHistory: (tagId: string) => DataPoint[];
}

// ============================================
// WIDGET TYPES
// ============================================

export type WidgetType =
  | 'lorawan_device'
  | 'gsm_device'
  | 'wifi_device'
  | 'bluetooth_device'
  | 'realtime_chart'
  | 'gauge'
  | 'device_list'
  | 'status_summary'
  | 'map';

export type ChartType = 'line' | 'area' | 'bar' | 'composed';

// ============================================
// WIDGET CONFIGURATION TYPES
// ============================================

export interface BaseWidgetConfig {
  title?: string;
  showHeader?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface LoRaWANDeviceWidgetConfig extends BaseWidgetConfig {
  deviceId?: string;
  showMetrics?: ('rssi' | 'snr' | 'frameCount' | 'battery' | 'joinStatus')[];
}

export interface GSMDeviceWidgetConfig extends BaseWidgetConfig {
  deviceId?: string;
  showMetrics?: ('signalStrength' | 'network' | 'battery' | 'dataUsage')[];
}

export interface WiFiDeviceWidgetConfig extends BaseWidgetConfig {
  deviceId?: string;
  showMetrics?: ('signalStrength' | 'bandwidth' | 'latency' | 'packetLoss')[];
}

export interface BluetoothDeviceWidgetConfig extends BaseWidgetConfig {
  deviceId?: string;
  showMetrics?: ('rssi' | 'battery' | 'proximity' | 'bonded')[];
}

export interface RealtimeChartWidgetConfig extends BaseWidgetConfig {
  dataSource: string;
  chartType: ChartType;
  color: string;
  unit?: string;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface GaugeWidgetConfig extends BaseWidgetConfig {
  dataSource: string;
  unit: string;
  min: number;
  max: number;
  thresholds?: Array<{
    value: number;
    color: string;
  }>;
}

export interface DeviceListWidgetConfig extends BaseWidgetConfig {
  deviceType: 'lorawan' | 'gsm' | 'wifi' | 'bluetooth';
  columns: string[];
  pageSize?: number;
}

export interface StatusSummaryWidgetConfig extends BaseWidgetConfig {
  showCounts?: boolean;
  showCharts?: boolean;
}

export interface MapWidgetConfig extends BaseWidgetConfig {
  showDevices?: boolean;
  deviceTypes?: ('lorawan' | 'gsm' | 'wifi' | 'bluetooth')[];
  zoom?: number;
}

export type WidgetConfig =
  | LoRaWANDeviceWidgetConfig
  | GSMDeviceWidgetConfig
  | WiFiDeviceWidgetConfig
  | BluetoothDeviceWidgetConfig
  | RealtimeChartWidgetConfig
  | GaugeWidgetConfig
  | DeviceListWidgetConfig
  | StatusSummaryWidgetConfig
  | MapWidgetConfig;

// ============================================
// WIDGET INTERFACE
// ============================================

export interface DashboardWidget {
  id: string;
  userId: string;
  widgetKey: string;
  widgetType: WidgetType;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
  };
  config: WidgetConfig;
  title?: string;
  showHeader: boolean;
  refreshInterval: number;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// WIDGET TEMPLATES
// ============================================

export interface WidgetTemplate {
  widgetType: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: 'device' | 'data' | 'visualization' | 'map';
  defaultLayout: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  defaultConfig: Partial<WidgetConfig>;
}

// ============================================
// API TYPES
// ============================================

export interface CreateWidgetRequest {
  widgetKey: string;
  widgetType: WidgetType;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  config: WidgetConfig;
  title?: string;
  showHeader?: boolean;
  refreshInterval?: number;
  visible?: boolean;
}

export interface UpdateWidgetRequest {
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: Partial<WidgetConfig>;
  title?: string;
  showHeader?: boolean;
  refreshInterval?: number;
  visible?: boolean;
}

export interface WidgetLayoutUpdate {
  widgetId: string;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

// ============================================
// WIDGET PROPS TYPES
// ============================================

export interface BaseWidgetProps {
  widget: DashboardWidget;
  onConfigure?: (widgetId: string) => void;
  onRemove?: (widgetId: string) => void;
}

// ============================================
// WIDGET STORE TYPES
// ============================================

export interface WidgetStore {
  widgets: DashboardWidget[];
  loading: boolean;
  error: string | null;

  fetchWidgets: () => Promise<void>;
  addWidget: (widget: CreateWidgetRequest) => Promise<void>;
  updateWidget: (widgetId: string, updates: UpdateWidgetRequest) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  updateLayout: (layouts: WidgetLayoutUpdate[]) => Promise<void>;
  clearError: () => void;
}

// ============================================
// DEFAULT WIDGET TEMPLATES
// ============================================

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    widgetType: 'lorawan_device',
    name: 'LoRaWAN Device',
    description: 'Monitor a specific LoRaWAN device with RSSI, SNR, and frame counts',
    icon: 'Radio',
    category: 'device',
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: {
      showMetrics: ['rssi', 'snr', 'frameCount', 'joinStatus'],
      refreshInterval: 5000,
    } as LoRaWANDeviceWidgetConfig,
  },
  {
    widgetType: 'gsm_device',
    name: 'GSM Device',
    description: 'Monitor GSM device with signal strength, network type, and battery',
    icon: 'Smartphone',
    category: 'device',
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: {
      showMetrics: ['signalStrength', 'network', 'battery'],
      refreshInterval: 5000,
    } as GSMDeviceWidgetConfig,
  },
  {
    widgetType: 'wifi_device',
    name: 'Wi-Fi Device',
    description: 'Monitor Wi-Fi device with signal, bandwidth, and latency',
    icon: 'Wifi',
    category: 'device',
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: {
      showMetrics: ['signalStrength', 'bandwidth', 'latency'],
      refreshInterval: 5000,
    } as WiFiDeviceWidgetConfig,
  },
  {
    widgetType: 'bluetooth_device',
    name: 'Bluetooth Device',
    description: 'Monitor Bluetooth device with RSSI, battery, and proximity',
    icon: 'Bluetooth',
    category: 'device',
    defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    defaultConfig: {
      showMetrics: ['rssi', 'battery', 'proximity'],
      refreshInterval: 5000,
    } as BluetoothDeviceWidgetConfig,
  },
  {
    widgetType: 'realtime_chart',
    name: 'Real-time Chart',
    description: 'Display real-time data in line or area chart format',
    icon: 'LineChart',
    category: 'data',
    defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 },
    defaultConfig: {
      dataSource: '',
      chartType: 'area',
      color: '#3b82f6',
      refreshInterval: 5000,
    } as RealtimeChartWidgetConfig,
  },
  {
    widgetType: 'gauge',
    name: 'Gauge',
    description: 'Display a metric in a circular gauge format',
    icon: 'Gauge',
    category: 'visualization',
    defaultLayout: { w: 3, h: 4, minW: 2, minH: 3 },
    defaultConfig: {
      dataSource: '',
      unit: '',
      min: 0,
      max: 100,
      refreshInterval: 5000,
    } as GaugeWidgetConfig,
  },
  {
    widgetType: 'device_list',
    name: 'Device List',
    description: 'Display a filterable list of devices by type',
    icon: 'List',
    category: 'data',
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    defaultConfig: {
      deviceType: 'lorawan',
      columns: ['name', 'status'],
      pageSize: 10,
      refreshInterval: 10000,
    } as DeviceListWidgetConfig,
  },
  {
    widgetType: 'status_summary',
    name: 'Status Summary',
    description: 'Overview of all device statuses with counts and charts',
    icon: 'BarChart3',
    category: 'visualization',
    defaultLayout: { w: 12, h: 3, minW: 6, minH: 2 },
    defaultConfig: {
      showCounts: true,
      showCharts: true,
      refreshInterval: 10000,
    } as StatusSummaryWidgetConfig,
  },
  {
    widgetType: 'map',
    name: 'Device Map',
    description: 'Display devices on an interactive map',
    icon: 'Map',
    category: 'map',
    defaultLayout: { w: 12, h: 6, minW: 6, minH: 4 },
    defaultConfig: {
      showDevices: true,
      deviceTypes: ['lorawan', 'gsm', 'wifi', 'bluetooth'],
      zoom: 12,
      refreshInterval: 15000,
    } as MapWidgetConfig,
  },
];
