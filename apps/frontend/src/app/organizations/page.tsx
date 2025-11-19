'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Input } from '@/components/ui/input';
import { useOrganizations } from '@/hooks/useOrganizations';
import { formatRelativeTime } from '@/lib/format';

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const { organizations, loading, error } = useOrganizations();

  const filteredOrganizations = organizations.filter((org) =>
    org?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Organizations"
        description="Manage organizations and multi-tenancy"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Organizations' }]}
        action={{
          label: 'Create Organization',
          href: '/organizations/new',
        }}
      />

      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading organizations...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : filteredOrganizations.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No organizations found"
            description="Create an organization to manage multiple projects"
            action={{
              label: 'Create Organization',
              href: '/organizations/new',
            }}
          />
        ) : (
          <div className="bg-[#151f2e] rounded-lg border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">
                Organizations ({filteredOrganizations.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Projects</div>
                <div className="col-span-2">Devices</div>
                <div className="col-span-2">Members</div>
                <div className="col-span-2">Created</div>
              </div>
              {filteredOrganizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/organizations/${org.id}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="col-span-4">
                    <div className="font-medium text-white">{org.name}</div>
                    {org.description && (
                      <div className="text-sm text-gray-400 truncate">{org.description}</div>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-300">
                    {org.projectCount}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-300">
                    {org.deviceCount}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-300">
                    {org.memberCount}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-400">
                    {formatRelativeTime(org.createdAt)}
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
