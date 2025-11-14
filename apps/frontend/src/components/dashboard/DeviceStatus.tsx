'use client';

import { Activity, AlertCircle, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DeviceData } from '@/types/dashboard';

interface DeviceStatusProps {
  device: DeviceData;
  className?: string;
  variant?: 'compact' | 'detailed';
}

export const DeviceStatus = ({ device, className, variant = 'compact' }: DeviceStatusProps) => {
  const getStatusConfig = (status: DeviceData['status']) => {
    switch (status) {
      case 'ONLINE':
        return {
          icon: Activity,
          label: 'Online',
          color: 'text-green-500',
          badgeVariant: 'default' as const,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
        };
      case 'OFFLINE':
        return {
          icon: XCircle,
          label: 'Offline',
          color: 'text-gray-500',
          badgeVariant: 'secondary' as const,
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
        };
      case 'ERROR':
        return {
          icon: AlertCircle,
          label: 'Error',
          color: 'text-red-500',
          badgeVariant: 'destructive' as const,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        };
      default:
        return {
          icon: XCircle,
          label: 'Unknown',
          color: 'text-gray-500',
          badgeVariant: 'secondary' as const,
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
        };
    }
  };

  const config = getStatusConfig(device.status);
  const Icon = config.icon;

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('rounded-full p-1', config.bgColor)}>
          <Icon className={cn('h-3 w-3', config.color)} aria-hidden="true" />
        </div>
        <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border p-4', config.bgColor, config.borderColor, className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn('h-5 w-5', config.color)} aria-hidden="true" />
            <h3 className="font-semibold text-lg">{device.name}</h3>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">ID:</span> {device.id}
            </p>
            <p>
              <span className="font-medium">Type:</span> {device.type}
            </p>
            {device.location && (
              <p>
                <span className="font-medium">Location:</span> {device.location}
              </p>
            )}
            <p>
              <span className="font-medium">Last Update:</span>{' '}
              {formatLastUpdate(device.lastUpdate)}
            </p>
          </div>
        </div>
        <Badge variant={config.badgeVariant} className="ml-2">
          {config.label}
        </Badge>
      </div>
      {Array.isArray(device.tags) && device.tags.length > 0 && (
        // {device.tags.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Active Tags: {device.tags.length}</p>
          <div className="flex flex-wrap gap-1">
            {device.tags.slice(0, 5).map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {device.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{device.tags.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
