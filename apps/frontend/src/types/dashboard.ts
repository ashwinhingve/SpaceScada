// WebSocket Types
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export interface DeviceData {
  id: string;
  name: string;
  type: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  location?: string;
  tags: DeviceTag[];
  lastUpdate: string;
}

export interface DeviceTag {
  id: string;
  deviceId: string;
  name: string;
  dataType: 'FLOAT' | 'INTEGER' | 'BOOLEAN' | 'STRING';
  unit?: string;
  value: number | boolean | string | null;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
  timestamp: string;
}

export interface DataPoint {
  timestamp: string;
  value: number | boolean | string | null;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
}

export interface DataUpdatePayload {
  deviceId: string;
  tags: DeviceTag[];
  timestamp: string;
}

export interface DeviceStatusPayload {
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  timestamp: string;
}

// Store Types
export interface DashboardState {
  // Connection
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;

  // Devices
  devices: Map<string, DeviceData>;
  selectedDeviceId: string | null;

  // Historical Data (last 100 points per tag)
  tagHistory: Map<string, DataPoint[]>;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  setDevices: (devices: DeviceData[]) => void;
  updateDevice: (device: DeviceData) => void;
  updateDeviceTags: (deviceId: string, tags: DeviceTag[]) => void;
  updateDeviceStatus: (deviceId: string, status: DeviceData['status']) => void;

  setSelectedDevice: (deviceId: string | null) => void;

  addDataPoint: (tagId: string, dataPoint: DataPoint) => void;
  getTagHistory: (tagId: string) => DataPoint[];
}

// Chart Types
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  quality: string;
}

export interface SparklineData {
  values: number[];
  timestamps: number[];
}
