import { create, StateCreator } from 'zustand';

import { ConnectionStatus, DashboardState, DataPoint, DeviceData, DeviceTag } from '@/types/dashboard';

const MAX_HISTORY_SIZE = 100;

export const useDashboardStore = create<DashboardState>(
  ((set, get) => ({
  // Initial state
  connectionStatus: ConnectionStatus.DISCONNECTED,
  reconnectAttempts: 0,
  devices: new Map(),
  selectedDeviceId: null,
  tagHistory: new Map(),

  // Connection actions
  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status });
  },

  incrementReconnectAttempts: () => {
    set((state: DashboardState) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    }));
  },

  resetReconnectAttempts: () => {
    set({ reconnectAttempts: 0 });
  },

  // Device actions
  setDevices: (devices: DeviceData[]) => {
    const deviceMap = new Map<string, DeviceData>();
    devices.forEach((device: DeviceData) => {
      deviceMap.set(device.id, device);
    });
    set({ devices: deviceMap });
  },

  updateDevice: (device: DeviceData) => {
    set((state: DashboardState) => {
      const newDevices = new Map(state.devices);
      newDevices.set(device.id, device);
      return { devices: newDevices };
    });
  },

  updateDeviceTags: (deviceId: string, tags: DeviceTag[]) => {
    set((state: DashboardState) => {
      const device = state.devices.get(deviceId);
      if (!device) return state;

      const updatedDevice = {
        ...device,
        tags,
        lastUpdate: new Date().toISOString(),
      };

      const newDevices = new Map(state.devices);
      newDevices.set(deviceId, updatedDevice);

      // Add data points to history
      const newTagHistory = new Map(state.tagHistory);
      tags.forEach((tag: DeviceTag) => {
        const history = newTagHistory.get(tag.id) || [];
        const dataPoint: DataPoint = {
          timestamp: tag.timestamp,
          value: tag.value,
          quality: tag.quality,
        };

        // Add to history and maintain max size
        const updatedHistory = [...history, dataPoint];
        if (updatedHistory.length > MAX_HISTORY_SIZE) {
          updatedHistory.shift();
        }

        newTagHistory.set(tag.id, updatedHistory);
      });

      return {
        devices: newDevices,
        tagHistory: newTagHistory,
      };
    });
  },

  updateDeviceStatus: (deviceId: string, status: string) => {
    set((state: DashboardState) => {
      const device = state.devices.get(deviceId);
      if (!device) return state;

      const updatedDevice: DeviceData = {
        ...device,
        status: status as 'ONLINE' | 'OFFLINE' | 'ERROR' | 'online' | 'offline' | 'error',
        lastUpdate: new Date().toISOString(),
      };

      const newDevices = new Map(state.devices);
      newDevices.set(deviceId, updatedDevice);

      return { devices: newDevices };
    });
  },

  setSelectedDevice: (deviceId: string | null) => {
    set({ selectedDeviceId: deviceId });
  },

  // History actions
  addDataPoint: (tagId: string, dataPoint: DataPoint) => {
    set((state: DashboardState) => {
      const history = state.tagHistory.get(tagId) || [];
      const updatedHistory = [...history, dataPoint];

      // Maintain circular buffer
      if (updatedHistory.length > MAX_HISTORY_SIZE) {
        updatedHistory.shift();
      }

      const newTagHistory = new Map(state.tagHistory);
      newTagHistory.set(tagId, updatedHistory);

      return { tagHistory: newTagHistory };
    });
  },

  getTagHistory: (tagId: string) => {
    return get().tagHistory.get(tagId) || [];
  },
})) as StateCreator<DashboardState>);
