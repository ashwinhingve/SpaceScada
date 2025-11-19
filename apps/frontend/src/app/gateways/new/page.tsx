'use client';

import { useRouter } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCreateGateway } from '@/hooks/useGateways';
import { gatewaySchema, type GatewayFormData } from '@/lib/validations/gateway';

export default function NewGatewayPage() {
  const router = useRouter();
  const { createGateway, loading } = useCreateGateway();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GatewayFormData>({
    resolver: zodResolver(gatewaySchema),
    defaultValues: {
      networkSettings: {
        requireAuth: false,
        publicStatus: true,
        publicLocation: true,
        packetBrokerForwarding: true,
        statusLocationUpdates: false,
        enforceDutyCycle: true,
      },
    },
  });

  const onSubmit = async (data: GatewayFormData) => {
    try {
      await createGateway(data);
      router.push('/gateways');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Register Gateway"
        description="Register a new protocol gateway for SCADA devices"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Gateways', href: '/gateways' },
          { label: 'Register' },
        ]}
      />

      <div className="max-w-2xl">
        <Card className="bg-[#151f2e] border-gray-800">
          <CardHeader>
            <CardTitle>Gateway Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Gateway Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Main Gateway"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
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

              <div className="space-y-2">
                <Label htmlFor="eui">Gateway EUI (Optional)</Label>
                <Input
                  id="eui"
                  {...register('eui')}
                  placeholder="A84041FFFF29DBE6"
                  maxLength={16}
                  className={errors.eui ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-400">16 hexadecimal characters</p>
                {errors.eui && <p className="text-sm text-red-500">{errors.eui.message}</p>}
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-semibold mb-4">Network Settings</h3>
                <div className="space-y-4">
                  {[
                    { key: 'requireAuth' as const, label: 'Require authenticated connection' },
                    { key: 'publicStatus' as const, label: 'Public status' },
                    { key: 'publicLocation' as const, label: 'Public location' },
                    { key: 'packetBrokerForwarding' as const, label: 'Packet Broker forwarding' },
                    { key: 'statusLocationUpdates' as const, label: 'Status location updates' },
                    { key: 'enforceDutyCycle' as const, label: 'Enforce duty cycle' },
                  ].map(({ key, label }) => {
                    const networkSettings = watch('networkSettings') || {};
                    const isChecked = networkSettings[key] || false;

                    return (
                      <div key={key} className="flex items-center justify-between">
                        <Label htmlFor={key} className="cursor-pointer">
                          {label}
                        </Label>
                        <Switch
                          id={key}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentSettings = watch('networkSettings') || {};
                            setValue('networkSettings', {
                              ...currentSettings,
                              [key]: checked,
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
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
                  {loading ? 'Registering...' : 'Register Gateway'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
