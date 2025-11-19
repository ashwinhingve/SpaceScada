'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Key, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApiKeys, useDeleteApiKey } from '@/hooks/useApiKeys';
import { formatRelativeTime } from '@/lib/format';

export default function ApiKeysPage() {
  const { apiKeys, loading, error, refetch } = useApiKeys();
  const { deleteApiKey, loading: deleting } = useDeleteApiKey();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      try {
        await deleteApiKey(id);
        refetch();
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="API Keys"
        description="Manage API keys for authentication"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Settings', href: '/settings' },
          { label: 'API Keys' },
        ]}
        action={{
          label: 'Create API Key',
          href: '/settings/api-keys/new',
        }}
      />

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading API keys...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : apiKeys.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API keys found"
            description="Create an API key to authenticate with the API"
            action={{
              label: 'Create API Key',
              href: '/settings/api-keys/new',
            }}
          />
        ) : (
          <div className="bg-[#151f2e] rounded-lg border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">API Keys ({apiKeys.length})</h3>
            </div>
            <div className="divide-y divide-gray-800">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-4">Rights</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-2">Last Used</div>
                <div className="col-span-1">Actions</div>
              </div>
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/50"
                >
                  <div className="col-span-3">
                    <div className="font-medium text-white">{apiKey.name}</div>
                    <div className="text-sm text-gray-400 font-mono">{apiKey.id.slice(0, 8)}</div>
                  </div>
                  <div className="col-span-4 flex items-center gap-2 flex-wrap">
                    {apiKey.rights.slice(0, 3).map((right) => (
                      <Badge key={right} variant="outline" className="text-xs">
                        {right}
                      </Badge>
                    ))}
                    {apiKey.rights.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{apiKey.rights.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-400">
                    {formatRelativeTime(apiKey.createdAt)}
                  </div>
                  <div className="col-span-2 flex items-center text-gray-400">
                    {apiKey.lastUsedAt ? formatRelativeTime(apiKey.lastUsedAt) : 'Never'}
                  </div>
                  <div className="col-span-1 flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(apiKey.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
