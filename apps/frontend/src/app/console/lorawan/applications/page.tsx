'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Trash2, Edit, ExternalLink, Activity, AlertCircle } from 'lucide-react';
import { DeviceList } from '@/features/devices/components/device-list/DeviceList';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANApplication } from '@/core/api/endpoints';

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<LoRaWANApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await lorawanAPI.applications.getAll();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await lorawanAPI.applications.delete(id);
      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    }
  };

  const renderApplicationCard = (
    device: { id: string; name: string },
    onDelete?: (id: string) => void
  ) => {
    const app = device as LoRaWANApplication;
    return (
      <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-white">{app.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  {app.description || 'No description'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Organization</p>
              <p className="text-white font-medium">{app.organization_id}</p>
            </div>
            <div>
              <p className="text-gray-400">Created</p>
              <p className="text-white font-medium">
                {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/lorawan/applications/${app.id}`)}
              className="flex-1 border-gray-600 hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/console/lorawan/applications/${app.id}/edit`)}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(app.id)}
                className="border-red-500 text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">LoRaWAN Applications</h1>
          <p className="text-gray-400">Manage your LoRaWAN application instances</p>
        </div>
        <Button
          onClick={() => router.push('/console/lorawan/applications/new')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Application
        </Button>
      </div>

      {/* Device List */}
      <DeviceList
        title="LoRaWAN Applications"
        devices={applications}
        loading={loading}
        error={error}
        renderCard={renderApplicationCard}
        onDelete={handleDelete}
        createHref="/console/lorawan/applications/new"
        emptyMessage="No applications found. Create your first LoRaWAN application to get started."
      />
    </div>
  );
}
