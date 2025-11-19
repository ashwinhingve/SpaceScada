'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Cpu } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useEffect } from 'react';
import type { Device } from '@/types/entities';
import { formatRelativeTime } from '@/lib/format';

export default function DevicesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      const response = await apiClient.getDevices({
        filters: {
          type: typeFilter !== 'all' ? (typeFilter as any) : undefined,
        },
      });
      if (response.success && response.data) {
        setDevices(response.data);
      } else {
        setError(response.error || 'Failed to load devices');
      }
      setLoading(false);
    };
    fetchDevices();
  }, [typeFilter]);

  const filteredDevices = devices.filter((device) =>
    device?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Devices"
        description="Manage SCADA devices and end devices"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Devices' }]}
        action={{
          label: 'Add Device',
          href: '/devices/new',
        }}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="plc">PLC</SelectItem>
              <SelectItem value="sensor">Sensor</SelectItem>
              <SelectItem value="actuator">Actuator</SelectItem>
              <SelectItem value="gateway">Gateway</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading devices...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : filteredDevices.length === 0 ? (
          <EmptyState
            icon={Cpu}
            title="No devices found"
            description="Add your first device to start monitoring"
            action={{
              label: 'Add Device',
              href: '/devices/new',
            }}
          />
        ) : (
          <div className="bg-[#151f2e] rounded-lg border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">
                Devices ({filteredDevices.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Protocol</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Last Seen</div>
              </div>
              {filteredDevices.map((device) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="col-span-3">
                    <div className="font-medium text-white">{device.name}</div>
                    <div className="text-sm text-gray-400 font-mono">{device.id.slice(0, 8)}</div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge variant="outline">{device.type.toUpperCase()}</Badge>
                  </div>
                  <div className="col-span-2 flex items-center text-gray-300">
                    {device.protocol.toUpperCase()}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge
                      variant={
                        device.status === 'ONLINE'
                          ? 'default'
                          : device.status === 'ERROR'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          device.status === 'ONLINE'
                            ? 'bg-green-500'
                            : device.status === 'ERROR'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                        }`}
                      />
                      {device.status}
                    </Badge>
                  </div>
                  <div className="col-span-3 flex items-center text-gray-400">
                    {device.lastSeen ? formatRelativeTime(device.lastSeen) : 'Never'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
