'use client';

import { SignalQuality } from '@webscada/shared-types';

interface SignalStrengthIndicatorProps {
  strength: number; // 0-100
  quality: SignalQuality;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SignalStrengthIndicator({
  strength,
  quality,
  showLabel = true,
  size = 'md',
}: SignalStrengthIndicatorProps) {
  const bars = Math.ceil((strength / 100) * 5);

  const sizeClasses = {
    sm: 'w-3 h-4',
    md: 'w-4 h-6',
    lg: 'w-5 h-8',
  };

  const qualityColors = {
    EXCELLENT: 'bg-green-500',
    GOOD: 'bg-green-400',
    FAIR: 'bg-yellow-500',
    POOR: 'bg-orange-500',
    NO_SIGNAL: 'bg-red-500',
  };

  const qualityLabels = {
    EXCELLENT: 'Excellent',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
    NO_SIGNAL: 'No Signal',
  };

  const color = qualityColors[quality];

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-0.5">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`${sizeClasses[size]} rounded-sm transition-colors ${
              bar <= bars ? color : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ height: `${(bar / 5) * 100}%` }}
          />
        ))}
      </div>
      {showLabel && (
        <div className="flex flex-col text-xs">
          <span className="font-medium">{strength}%</span>
          <span className="text-gray-500 dark:text-gray-400">{qualityLabels[quality]}</span>
        </div>
      )}
    </div>
  );
}
