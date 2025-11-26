'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Layers, Activity, Calendar, Building2 } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';
import type { LoRaWANApplication } from '@/core/api/endpoints/lorawan.api';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function LoRaWANApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<LoRaWANApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (applicationId) loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const data = await lorawanAPI.applications.getById(applicationId);
      setApplication(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    try {
      setDeleting(true);
      await lorawanAPI.applications.delete(application.id);
      router.push('/console/lorawan/applications');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <p className="text-red-500">{error || 'Application not found'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="border-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Layers className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{application.name}</h1>
              <p className="text-gray-400">
                {application.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/console/lorawan/applications/${application.id}/edit`)}
            className="border-gray-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{application.organization_id}</div>
            <p className="text-gray-400 text-sm mt-2">Organization ID</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Date(application.created_at).toLocaleDateString()}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {new Date(application.created_at).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {new Date(application.updated_at).toLocaleDateString()}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {new Date(application.updated_at).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Application Details</CardTitle>
          <CardDescription className="text-gray-400">
            Detailed information about this LoRaWAN application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Application ID</p>
              <p className="text-white font-mono text-sm">{application.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Application Name</p>
              <p className="text-white font-medium">{application.name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 text-sm mb-1">Description</p>
              <p className="text-white">{application.description || 'No description provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Managing LoRaWAN Devices</p>
              <p className="text-sm text-gray-400">
                To add devices to this application, navigate to the LoRaWAN Devices page and create
                a new device, selecting this application during the setup process. All devices
                associated with this application will share the same organizational context and can
                be managed collectively.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/console/lorawan/devices/new')}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                >
                  Add Device to Application
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete LoRaWAN Application?"
        description={`Are you sure you want to delete "${application.name}"? This action cannot be undone and may affect associated devices.`}
        itemName={application.name}
      />
    </div>
  );
}
