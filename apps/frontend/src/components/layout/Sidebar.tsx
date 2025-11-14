'use client';

import { Activity, AlertCircle, ChevronRight, Filter, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard-store';
import { DeviceData } from '@/types/dashboard';

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const DeviceListItem = ({
  device,
  isSelected,
  onClick,
}: {
  device: DeviceData;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const getStatusIcon = () => {
    switch (device.status) {
      case 'ONLINE':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'OFFLINE':
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (device.status) {
      case 'ONLINE':
        return 'border-green-500/20 bg-green-500/5';
      case 'ERROR':
        return 'border-red-500/20 bg-red-500/5';
      case 'OFFLINE':
        return 'border-gray-500/20 bg-gray-500/5';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all hover:shadow-md',
        isSelected ? 'border-primary bg-primary/10 shadow-md' : getStatusColor()
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon()}
            <h3 className="font-medium text-sm truncate">{device.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground truncate">{device.type}</p>
          {device.location && (
            <p className="text-xs text-muted-foreground truncate mt-1">📍 {device.location}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-muted-foreground">Tags:</span>
            {/* <span className="font-medium">{device.tags.length}</span> */}
            {Array.isArray(device.tags) ? device.tags.length : 0}
          </div>
        </div>
        {isSelected && <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 ml-2" />}
      </div>
    </button>
  );
};

export const Sidebar = ({ className, isOpen = true, onClose }: SidebarProps) => {
  const { devices, selectedDeviceId, setSelectedDevice } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'ERROR'>('ALL');

  // const deviceList = useMemo(() => {
  //   return Array.from(devices.values());
  // }, [devices]);

  // const filteredDevices = useMemo(() => {
  //   return deviceList.filter((device) => {
  //     const matchesSearch =
  //       device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       device.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       (device.location && device.location.toLowerCase().includes(searchQuery.toLowerCase()));

  //     const matchesStatus = statusFilter === 'ALL' || device.status === statusFilter;

  //     return matchesSearch && matchesStatus;
  //   });
  // }, [deviceList, searchQuery, statusFilter]);

  // const statusCounts = useMemo(() => {
  //   return deviceList.reduce(
  //     (acc, device) => {
  //       acc[device.status]++;
  //       acc.ALL++;
  //       return acc;
  //     },
  //     { ALL: 0, ONLINE: 0, OFFLINE: 0, ERROR: 0 } as Record<string, number>
  //   );
  // }, [deviceList]);
  // ensure we only work with actual device objects
  const deviceList = useMemo(() => {
    // devices is assumed to be a Map — filter out any non-truthy values just in case
    return Array.from(devices.values()).filter(Boolean) as DeviceData[];
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const q = (searchQuery ?? '').toLowerCase();

    return deviceList.filter((device) => {
      // guard every field that we call toLowerCase on
      const name = (device?.name ?? '').toLowerCase();
      const type = (device?.type ?? '').toLowerCase();
      const location = (device?.location ?? '').toLowerCase();

      const matchesSearch =
        name.includes(q) || type.includes(q) || (location && location.includes(q));

      const matchesStatus = statusFilter === 'ALL' || device?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deviceList, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    // initialize explicitly
    const acc: Record<string, number> = { ALL: 0, ONLINE: 0, OFFLINE: 0, ERROR: 0 };

    for (const device of deviceList) {
      // be defensive about status value
      const status = device?.status ?? 'OFFLINE'; // or use 'UNKNOWN' if you prefer
      if (!(status in acc)) {
        // if API returns unexpected status, add it dynamically so counting won't crash
        acc[status] = 0;
      }
      acc[status]++;
      acc.ALL++;
    }

    return acc;
  }, [deviceList]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-50 w-80 border-r bg-background transition-transform lg:sticky lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-md border transition-colors',
                  statusFilter === 'ALL'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent'
                )}
              >
                All ({statusCounts.ALL})
              </button>
              <button
                onClick={() => setStatusFilter('ONLINE')}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-md border transition-colors',
                  statusFilter === 'ONLINE'
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-border hover:bg-accent'
                )}
              >
                Online ({statusCounts.ONLINE})
              </button>
              <button
                onClick={() => setStatusFilter('OFFLINE')}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-md border transition-colors',
                  statusFilter === 'OFFLINE'
                    ? 'border-gray-500 bg-gray-500 text-white'
                    : 'border-border hover:bg-accent'
                )}
              >
                Offline ({statusCounts.OFFLINE})
              </button>
              <button
                onClick={() => setStatusFilter('ERROR')}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-md border transition-colors',
                  statusFilter === 'ERROR'
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-border hover:bg-accent'
                )}
              >
                Error ({statusCounts.ERROR})
              </button>
            </div>
          </div>

          {/* Device list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No devices match your filters'
                    : 'No devices available'}
                </div>
              ) : (
                filteredDevices.map((device) => (
                  <DeviceListItem
                    key={device.id}
                    device={device}
                    isSelected={selectedDeviceId === device.id}
                    onClick={() => {
                      setSelectedDevice(device.id);
                      onClose?.();
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Footer stats */}
          <div className="p-4 border-t bg-muted/50">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{statusCounts.ONLINE}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">{statusCounts.OFFLINE}</div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">{statusCounts.ERROR}</div>
                <div className="text-xs text-muted-foreground">Error</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
