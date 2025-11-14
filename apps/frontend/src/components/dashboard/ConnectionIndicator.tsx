'use client';

import { AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/store/dashboard-store';
import { ConnectionStatus } from '@/types/dashboard';

interface ConnectionIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const ConnectionIndicator = ({ className, showLabel = true }: ConnectionIndicatorProps) => {
  const { connectionStatus, reconnectAttempts } = useDashboardStore();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return {
          icon: Wifi,
          label: 'Connected',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          dotColor: 'bg-green-500',
        };
      case ConnectionStatus.CONNECTING:
        return {
          icon: Loader2,
          label: reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})` : 'Connecting',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          dotColor: 'bg-yellow-500',
          animate: true,
        };
      case ConnectionStatus.DISCONNECTED:
        return {
          icon: WifiOff,
          label: 'Disconnected',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          dotColor: 'bg-gray-500',
        };
      case ConnectionStatus.ERROR:
        return {
          icon: AlertTriangle,
          label: 'Connection Error',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          dotColor: 'bg-red-500',
        };
      default:
        return {
          icon: WifiOff,
          label: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          dotColor: 'bg-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center',
          config.bgColor,
          'rounded-full p-2'
        )}
      >
        <Icon
          className={cn('h-4 w-4', config.color, config.animate && 'animate-spin')}
          aria-hidden="true"
        />
        <span
          className={cn(
            'absolute -top-1 -right-1 h-3 w-3 rounded-full',
            config.dotColor,
            connectionStatus === ConnectionStatus.CONNECTED && 'animate-pulse'
          )}
          aria-label={config.label}
        />
      </div>
      {showLabel && <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>}
    </div>
  );
};
