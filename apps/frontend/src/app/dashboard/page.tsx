'use client';

import { useEffect, useMemo, useState } from 'react';

import { DataCard } from '@/components/dashboard/DataCard';
import { DeviceStatus } from '@/components/dashboard/DeviceStatus';
import { MetricGauge } from '@/components/dashboard/MetricGauge';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDashboardStore } from '@/store/dashboard-store';

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { devices, selectedDeviceId, tagHistory, setDevices } = useDashboardStore();

  // Initialize WebSocket connection
  const { subscribe, unsubscribe } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3002',
    autoConnect: true,
    maxReconnectAttempts: 10,
  });

  // Fetch initial devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/devices`
        );
        const result = await response.json();
        if (result.success) {
          setDevices(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      }
    };

    fetchDevices();
  }, [setDevices]);

  // Get stable device IDs list
  const deviceIds = useMemo(() => {
    return Array.from(devices.values()).map((device) => device.id);
  }, [devices]);

  // Subscribe to all devices
  useEffect(() => {
    if (deviceIds.length > 0) {
      subscribe(deviceIds);
    }

    return () => {
      if (deviceIds.length > 0) {
        unsubscribe(deviceIds);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceIds.length]); // Only resubscribe if number of devices changes

  const selectedDevice = useMemo(() => {
    return selectedDeviceId ? devices.get(selectedDeviceId) : null;
  }, [selectedDeviceId, devices]);

  const deviceList = useMemo(() => {
    return Array.from(devices.values());
  }, [devices]);

  const allDevicesOnlineCount = useMemo(() => {
    return deviceList.filter((d) => d.status === 'ONLINE').length;
  }, [deviceList]);

  const allDevicesOfflineCount = useMemo(() => {
    return deviceList.filter((d) => d.status === 'OFFLINE').length;
  }, [deviceList]);

  const allDevicesErrorCount = useMemo(() => {
    return deviceList.filter((d) => d.status === 'ERROR').length;
  }, [deviceList]);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Overview section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Devices</p>
                    <p className="text-3xl font-bold">{deviceList.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🔌</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Online</p>
                    <p className="text-3xl font-bold text-green-600">{allDevicesOnlineCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Offline</p>
                    <p className="text-3xl font-bold text-gray-600">{allDevicesOfflineCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-500/10 flex items-center justify-center">
                    <span className="text-2xl">○</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-3xl font-bold text-red-600">{allDevicesErrorCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-2xl">⚠</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System health gauge */}
          {deviceList.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricGauge
                  title="Device Availability"
                  value={allDevicesOnlineCount}
                  max={deviceList.length}
                  unit="%"
                  description="Percentage of devices online"
                  thresholds={{ warning: 80, danger: 60 }}
                />
              </div>
            </div>
          )}

          {/* Selected device details */}
          {selectedDevice ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Device Details</h2>
                <DeviceStatus device={selectedDevice} variant="detailed" />
              </div>

              {/* Tag data cards */}
              {selectedDevice.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Real-time Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedDevice.tags.map((tag) => (
                      <DataCard key={tag.id} tag={tag} history={tagHistory.get(tag.id) || []} />
                    ))}
                  </div>
                </div>
              )}

              {/* Trend charts */}
              {selectedDevice.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Trends</h3>
                  <TrendChart
                    title={`${selectedDevice.name} - Data Trends`}
                    description="Real-time data visualization"
                    tags={selectedDevice.tags}
                    history={tagHistory}
                    height={400}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Device Selected</h3>
              <p className="text-muted-foreground max-w-md">
                Select a device from the sidebar to view its real-time data, trends, and status
                information.
              </p>
            </div>
          )}

          {/* All devices grid when no device selected */}
          {!selectedDevice && deviceList.length > 0 && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4">All Devices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deviceList.map((device) => (
                  <DeviceStatus key={device.id} device={device} variant="detailed" />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
