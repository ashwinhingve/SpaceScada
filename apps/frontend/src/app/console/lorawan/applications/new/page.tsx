'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Layers } from 'lucide-react';
import { lorawanAPI } from '@/core/api/endpoints';

export default function NewLoRaWANApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Application name is required');
      return;
    }
    if (!organizationId.trim()) {
      setError('Organization ID is required');
      return;
    }

    try {
      setLoading(true);

      const applicationData = {
        name,
        description: description || undefined,
        organization_id: organizationId,
      };

      await lorawanAPI.applications.create(applicationData);
      router.push('/console/lorawan/applications');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-white">Create LoRaWAN Application</h1>
            <p className="text-gray-400">Register a new LoRaWAN application instance</p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Application Information</CardTitle>
            <CardDescription className="text-gray-400">
              Basic information about your LoRaWAN application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Application Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Smart Agriculture App"
                className="bg-gray-900 border-gray-700 text-white"
                required
              />
              <p className="text-sm text-gray-500">
                Choose a descriptive name for your application
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and function of this application"
                className="bg-gray-900 border-gray-700 text-white"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Organization ID *</Label>
              <Input
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="e.g., org-12345"
                className="bg-gray-900 border-gray-700 text-white"
                required
              />
              <p className="text-sm text-gray-500">The organization that owns this application</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Layers className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">About LoRaWAN Applications</p>
                <p className="text-sm text-gray-400">
                  Applications are logical containers for your LoRaWAN devices. Each application can
                  have multiple devices and manages their configuration, data processing, and
                  integrations. Devices in the same application typically belong to the same use
                  case or deployment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-700"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
