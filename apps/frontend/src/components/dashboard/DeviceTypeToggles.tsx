'use client';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface DeviceTypeConfig {
  id: string;
  label: string;
  icon: string;
  count: number;
  enabled: boolean;
  color: string;
}

export interface DeviceTypeTogglesProps {
  deviceTypes: DeviceTypeConfig[];
  onToggle: (id: string, enabled: boolean) => void;
}

export function DeviceTypeToggles({ deviceTypes, onToggle }: DeviceTypeTogglesProps) {
  return (
    <div className="flex flex-wrap gap-6">
      {deviceTypes.map((deviceType) => (
        <div
          key={deviceType.id}
          className="flex items-center space-x-3 rounded-lg border border-border/40 p-3 bg-card/50 hover:bg-card transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{deviceType.icon}</span>
            <Label
              htmlFor={deviceType.id}
              className="cursor-pointer font-medium flex items-center gap-2"
            >
              {deviceType.label}
            </Label>
          </div>
          <Switch
            id={deviceType.id}
            checked={deviceType.enabled}
            onCheckedChange={(checked) => onToggle(deviceType.id, checked)}
          />
          <Badge
            variant="secondary"
            className="ml-2"
            style={{
              backgroundColor: deviceType.color,
              color: 'white',
            }}
          >
            Count: {deviceType.count}
          </Badge>
        </div>
      ))}
    </div>
  );
}
