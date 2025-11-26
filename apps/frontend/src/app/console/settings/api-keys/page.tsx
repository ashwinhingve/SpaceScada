'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  rights: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export default function ApiKeysPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const apiKeys: ApiKey[] = [
    {
      id: 'key-001',
      name: 'Production API Key',
      key: 'sat_1234567890abcdefghijklmnopqrstuvwxyz',
      rights: ['devices:read', 'devices:write', 'tags:read', 'tags:write'],
      createdAt: '2025-09-19',
      lastUsedAt: '2025-11-20',
    },
    {
      id: 'key-002',
      name: 'Read-Only Key',
      key: 'sat_abcdefghijklmnopqrstuvwxyz1234567890',
      rights: ['devices:read', 'tags:read'],
      createdAt: '2025-10-01',
    },
  ];

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  const maskKey = (key: string) => {
    return key.slice(0, 12) + '•'.repeat(key.length - 12);
  };

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/console" className="text-gray-400 hover:text-white">
            User settings
          </Link>
          <span className="text-gray-600">&gt;</span>
          <span className="text-white">API keys</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API keys</h1>
          <p className="text-gray-400">
            Manage API keys for programmatic access to Space Auto Tech
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/console/settings/api-keys/new">
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Link>
        </Button>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id} className="bg-[#1E293B] border-gray-800">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded">
                    <Key className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{apiKey.name}</h3>
                    <div className="text-gray-400 text-xs">ID: {apiKey.id}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => {
                    // Handle delete
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* API Key */}
              <div className="mb-4">
                <div className="flex items-center gap-2 bg-[#0F172A] p-3 rounded border border-gray-700">
                  <code className="flex-1 text-gray-300 text-sm font-mono">
                    {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                  >
                    {showKeys[apiKey.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(apiKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Rights */}
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Rights:</div>
                <div className="flex flex-wrap gap-2">
                  {apiKey.rights.map((right) => (
                    <span
                      key={right}
                      className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 text-xs"
                    >
                      {right}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Created:</span>
                  <div className="text-white">
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Last used:</span>
                  <div className="text-white">
                    {apiKey.lastUsedAt
                      ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Expires:</span>
                  <div className="text-white">
                    {apiKey.expiresAt
                      ? new Date(apiKey.expiresAt).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {apiKeys.length === 0 && (
        <Card className="bg-[#1E293B] border-gray-800">
          <div className="p-12 text-center">
            <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No API keys</h3>
            <p className="text-gray-400 mb-6">
              Create your first API key to start using the Space Auto Tech API
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/console/settings/api-keys/new">
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
