'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deviceSchema, type DeviceFormData } from '@/lib/validations/device';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

export default function NewDevicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      projectId: projectId || undefined,
    },
  });

  const onSubmit = async (data: DeviceFormData) => {
    setLoading(true);
    const response = await apiClient.createDevice(data);
    setLoading(false);

    if (response.success) {
      toast.success('Device created successfully');
      router.push('/devices');
    } else {
      toast.error(response.error || 'Failed to create device');
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Add Device"
        description="Add a new SCADA device or end device"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Devices', href: '/devices' },
          { label: 'Add' },
        ]}
      />

      <div className="max-w-2xl">
        <Card className="bg-[#151f2e] border-gray-800">
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Temperature Sensor 1"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Device Type *</Label>
                  <Select
                    value={watch('type')}
                    onValueChange={(value) => setValue('type', value as any)}
                  >
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plc">PLC</SelectItem>
                      <SelectItem value="sensor">Sensor</SelectItem>
                      <SelectItem value="actuator">Actuator</SelectItem>
                      <SelectItem value="gateway">Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol *</Label>
                  <Select
                    value={watch('protocol')}
                    onValueChange={(value) => setValue('protocol', value as any)}
                  >
                    <SelectTrigger className={errors.protocol ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modbus">Modbus</SelectItem>
                      <SelectItem value="mqtt">MQTT</SelectItem>
                      <SelectItem value="opcua">OPC UA</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.protocol && (
                    <p className="text-sm text-red-500">{errors.protocol.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eui">Device EUI (Optional)</Label>
                <Input
                  id="eui"
                  {...register('eui')}
                  placeholder="0123456789ABCDEF"
                  maxLength={16}
                  className={errors.eui ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-400">16 hexadecimal characters</p>
                {errors.eui && <p className="text-sm text-red-500">{errors.eui.message}</p>}
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
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Device'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
