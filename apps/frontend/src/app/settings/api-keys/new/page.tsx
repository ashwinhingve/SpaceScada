'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreateApiKey } from '@/hooks/useApiKeys';
import { apiKeySchema, type ApiKeyFormData } from '@/lib/validations/apiKey';
import type { ApiKeyRight } from '@/types/entities';

const AVAILABLE_RIGHTS: { value: ApiKeyRight; label: string; description: string }[] = [
  { value: 'all', label: 'All Permissions', description: 'Full access to all resources' },
  { value: 'devices:read', label: 'Read Devices', description: 'View device information' },
  { value: 'devices:write', label: 'Write Devices', description: 'Create and update devices' },
  { value: 'devices:delete', label: 'Delete Devices', description: 'Remove devices' },
  { value: 'tags:read', label: 'Read Tags', description: 'View tag data' },
  { value: 'tags:write', label: 'Write Tags', description: 'Update tag values' },
  { value: 'projects:read', label: 'Read Projects', description: 'View projects' },
  { value: 'projects:write', label: 'Write Projects', description: 'Create and update projects' },
  { value: 'gateways:read', label: 'Read Gateways', description: 'View gateways' },
  { value: 'gateways:write', label: 'Write Gateways', description: 'Register and update gateways' },
];

export default function NewApiKeyPage() {
  const router = useRouter();
  const { createApiKey, loading } = useCreateApiKey();
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedRights, setSelectedRights] = useState<ApiKeyRight[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
  });

  const onSubmit = async (data: ApiKeyFormData) => {
    try {
      const result = await createApiKey({ ...data, rights: selectedRights });
      if (result) {
        setCreatedKey(result.key);
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleRight = (right: ApiKeyRight) => {
    if (right === 'all') {
      setSelectedRights(selectedRights.includes('all') ? [] : ['all']);
    } else {
      setSelectedRights((prev) => {
        const newRights = prev.includes(right)
          ? prev.filter((r) => r !== right && r !== 'all')
          : [...prev.filter((r) => r !== 'all'), right];
        return newRights;
      });
    }
  };

  if (createdKey) {
    return (
      <AppLayout>
        <PageHeader
          title="API Key Created"
          breadcrumbs={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Settings', href: '/settings' },
            { label: 'API Keys', href: '/settings/api-keys' },
            { label: 'Created' },
          ]}
        />

        <div className="max-w-2xl space-y-6">
          <Alert>
            <AlertTitle>Important: Save your API key now!</AlertTitle>
            <AlertDescription>
              This is the only time you'll see this key. Make sure to copy it and store it securely.
            </AlertDescription>
          </Alert>

          <Card className="bg-[#151f2e] border-gray-800">
            <CardHeader>
              <CardTitle>Your API Key</CardTitle>
              <CardDescription>Use this key to authenticate API requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm break-all">
                  {createdKey}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <Button onClick={() => router.push('/settings/api-keys')}>Done</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Create API Key"
        description="Generate a new API key for authentication"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Settings', href: '/settings' },
          { label: 'API Keys', href: '/settings/api-keys' },
          { label: 'Create' },
        ]}
      />

      <div className="max-w-2xl">
        <Card className="bg-[#151f2e] border-gray-800">
          <CardHeader>
            <CardTitle>API Key Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Production API Key"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-4">
                <Label>Permissions *</Label>
                <div className="space-y-3">
                  {AVAILABLE_RIGHTS.map((right) => (
                    <div key={right.value} className="flex items-start space-x-3">
                      <Checkbox
                        id={right.value}
                        checked={selectedRights.includes(right.value)}
                        onCheckedChange={() => toggleRight(right.value)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={right.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {right.label}
                        </label>
                        <p className="text-sm text-gray-400">{right.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.rights && <p className="text-sm text-red-500">{errors.rights.message}</p>}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || selectedRights.length === 0}>
                  {loading ? 'Creating...' : 'Create API Key'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
