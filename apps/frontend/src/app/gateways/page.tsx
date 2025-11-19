'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Radio } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGateways } from '@/hooks/useGateways';
import { formatRelativeTime } from '@/lib/format';

export default function GatewaysPage() {
  const [search, setSearch] = useState('');
  const { gateways, loading, error } = useGateways();

  const filteredGateways = gateways.filter((gateway) =>
    gateway?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Gateways"
        description="Manage protocol gateways for SCADA devices"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Gateways' }]}
        action={{
          label: 'Register Gateway',
          href: '/gateways/new',
        }}
      />

      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search gateways..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading gateways...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : filteredGateways.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No gateways found"
            description="Register your first gateway to start connecting devices"
            action={{
              label: 'Register Gateway',
              href: '/gateways/new',
            }}
          />
        ) : (
          <div className="bg-[#151f2e] rounded-lg border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">
                Gateways ({filteredGateways.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Gateway EUI</div>
                <div className="col-span-2">Protocol</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Created</div>
              </div>
              {filteredGateways.map((gateway) => (
                <Link
                  key={gateway.id}
                  href={`/gateways/${gateway.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="col-span-3">
                    <div className="font-medium text-white">{gateway.name}</div>
                    <div className="text-sm text-gray-400 font-mono">{gateway.id.slice(0, 8)}</div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    {gateway.eui ? (
                      <code className="text-sm bg-gray-800 px-2 py-1 rounded">
                        {gateway.eui
                          .match(/.{1,2}/g)
                          ?.join(' ')
                          .toUpperCase()}
                      </code>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-300">
                    {gateway.protocol.toUpperCase()}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge
                      variant={
                        gateway.status === 'ONLINE'
                          ? 'default'
                          : gateway.status === 'ERROR'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          gateway.status === 'ONLINE'
                            ? 'bg-green-500'
                            : gateway.status === 'ERROR'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                        }`}
                      />
                      {gateway.status}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex items-center text-gray-400">
                    {formatRelativeTime(gateway.createdAt)}
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
