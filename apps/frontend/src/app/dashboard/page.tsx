'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Cpu, Database, Server } from 'lucide-react';

import { AreaChart } from '@/components/dashboard/charts/AreaChart';
import { BarChart } from '@/components/dashboard/charts/BarChart';
import { GaugeChart } from '@/components/dashboard/charts/GaugeChart';
import { PieChart } from '@/components/dashboard/charts/PieChart';
import { DeviceTypeConfig, DeviceTypeToggles } from '@/components/dashboard/DeviceTypeToggles';
import { Notification, NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { StatCard, StatCards } from '@/components/dashboard/StatCards';
import { TopEntities } from '@/components/dashboard/TopEntities';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDashboardStore } from '@/store/dashboard-store';

// Dynamic import for map component (SSR issue with Leaflet)
const DeviceMap = dynamic(
  () => import('@/components/dashboard/DeviceMap').then((mod) => mod.DeviceMap),
  { ssr: false }
);

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enabledDeviceTypes, setEnabledDeviceTypes] = useState<Set<string>>(
    new Set(['plc', 'sensor', 'actuator', 'gateway'])
  );

  const { devices, setDevices } = useDashboardStore();

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
  }, [deviceIds.length]);

  const deviceList = useMemo(() => {
    return Array.from(devices.values());
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return deviceList.filter((d) => enabledDeviceTypes.has(d.type));
  }, [deviceList, enabledDeviceTypes]);

  const onlineCount = useMemo(() => {
    return filteredDevices.filter((d) => d.status === 'ONLINE').length;
  }, [filteredDevices]);

  const offlineCount = useMemo(() => {
    return filteredDevices.filter((d) => d.status === 'OFFLINE').length;
  }, [filteredDevices]);

  const errorCount = useMemo(() => {
    return filteredDevices.filter((d) => d.status === 'ERROR').length;
  }, [filteredDevices]);

  // Convert devices to entities for TopEntities component
  const entities = useMemo(() => {
    return filteredDevices.map((device) => ({
      id: device.id,
      name: device.name,
      type: device.type === 'gateway' ? ('gateway' as const) : ('device' as const),
      status:
        device.status === 'ONLINE'
          ? 'Connected'
          : device.status === 'OFFLINE'
            ? 'Disconnected'
            : 'No recent activity',
      lastSeen: device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : undefined,
    }));
  }, [filteredDevices]);

  // Device type toggles configuration
  const deviceTypeConfigs: DeviceTypeConfig[] = useMemo(() => {
    const types = [
      { id: 'plc', label: 'PLC', icon: '🖥️', color: '#3b82f6' },
      { id: 'sensor', label: 'Sensors', icon: '📡', color: '#10b981' },
      { id: 'actuator', label: 'Actuators', icon: '⚙️', color: '#f59e0b' },
      { id: 'gateway', label: 'Gateways', icon: '🌐', color: '#8b5cf6' },
    ];

    return types.map((type) => ({
      ...type,
      count: deviceList.filter((d) => d.type === type.id).length,
      enabled: enabledDeviceTypes.has(type.id),
    }));
  }, [deviceList, enabledDeviceTypes]);

  const handleDeviceTypeToggle = (id: string, enabled: boolean) => {
    setEnabledDeviceTypes((prev) => {
      const newSet = new Set(prev);
      if (enabled) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Device locations for map
  const deviceLocations = useMemo(() => {
    return filteredDevices.map((device) => ({
      id: device.id,
      name: device.name,
      lat: 20.5937 + (Math.random() - 0.5) * 10, // Random coordinates around India
      lng: 78.9629 + (Math.random() - 0.5) * 10,
      status:
        device.status === 'ONLINE'
          ? ('connected' as const)
          : device.status === 'ERROR'
            ? ('error' as const)
            : ('disconnected' as const),
      type: device.type,
      lastSeen: device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : undefined,
    }));
  }, [filteredDevices]);

  // Mock notifications (replace with real data)
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'New API key created for application',
      message: 'A new API key has just been created for your application...',
      timestamp: new Date(Date.now() - 300000),
      type: 'info',
      read: false,
    },
  ];

  // Statistics cards
  const statCards: StatCard[] = [
    {
      id: 'total',
      label: 'Total Devices',
      value: filteredDevices.length,
      icon: Server,
      color: '#3b82f6',
      bgColor: '#3b82f6',
    },
    {
      id: 'online',
      label: 'Online',
      value: onlineCount,
      icon: Activity,
      color: '#10b981',
      bgColor: '#10b981',
    },
    {
      id: 'offline',
      label: 'Offline',
      value: offlineCount,
      icon: AlertCircle,
      color: '#6b7280',
      bgColor: '#6b7280',
    },
    {
      id: 'errors',
      label: 'Errors',
      value: errorCount,
      icon: AlertCircle,
      color: '#ef4444',
      bgColor: '#ef4444',
    },
    {
      id: 'cpu',
      label: 'Avg CPU',
      value: '42%',
      icon: Cpu,
      color: '#f59e0b',
      bgColor: '#f59e0b',
    },
    {
      id: 'data',
      label: 'Data Rate',
      value: '1.2k',
      icon: Database,
      color: '#8b5cf6',
      bgColor: '#8b5cf6',
      unit: 'msg/s',
    },
  ];

  // Chart data
  const deviceStatusData = [
    { name: 'Online', value: onlineCount },
    { name: 'Offline', value: offlineCount },
    { name: 'Error', value: errorCount },
  ];

  const deviceTypeData = useMemo(() => {
    return deviceTypeConfigs.map((config) => ({
      name: config.label,
      value: config.count,
    }));
  }, [deviceTypeConfigs]);

  const trendData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      name: `${i}:00`,
      online: Math.floor(Math.random() * onlineCount) + 1,
      offline: Math.floor(Math.random() * offlineCount),
    }));
  }, [onlineCount, offlineCount]);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Home › Dashboard</h2>
            <QuickActions />
          </div>

          {/* Statistics Cards */}
          <StatCards stats={statCards} />

          {/* Device Type Toggles */}
          <DeviceTypeToggles deviceTypes={deviceTypeConfigs} onToggle={handleDeviceTypeToggle} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Top Entities (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <TopEntities entities={entities} />

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PieChart
                  data={deviceStatusData}
                  title="Device Status Distribution"
                  colors={['#10b981', '#6b7280', '#ef4444']}
                  height={250}
                />
                <PieChart
                  data={deviceTypeData}
                  title="Device Types"
                  innerRadius={60}
                  height={250}
                />
              </div>

              {/* Area Chart */}
              <AreaChart
                data={trendData}
                dataKeys={['online', 'offline']}
                title="24-Hour Device Status Trend"
                colors={['#10b981', '#ef4444']}
                height={300}
              />

              {/* Bar Chart */}
              <BarChart
                data={deviceTypeConfigs.map((c) => ({
                  name: c.label,
                  count: c.count,
                }))}
                dataKeys={['count']}
                title="Devices by Type"
                colors={['#3b82f6']}
                height={250}
              />
            </div>

            {/* Right Column - Notifications (1/3 width) */}
            <div className="space-y-6">
              <NotificationsPanel notifications={notifications} />

              {/* System Health Gauge */}
              <GaugeChart
                value={(onlineCount / filteredDevices.length) * 100 || 0}
                title="System Health"
                unit="%"
                min={0}
                max={100}
                thresholds={{ warning: 70, danger: 50 }}
                size={200}
              />
            </div>
          </div>

          {/* Map Section */}
          <DeviceMap devices={deviceLocations} center={[20.5937, 78.9629]} zoom={5} />
        </main>
      </div>
    </div>
  );
}
