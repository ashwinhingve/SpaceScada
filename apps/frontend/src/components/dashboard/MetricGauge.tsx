'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricGaugeProps {
  title: string;
  value: number;
  max?: number;
  min?: number;
  unit?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  thresholds?: {
    warning?: number;
    danger?: number;
  };
}

const GaugeCircle = ({
  value,
  max,
  min,
  size,
  thresholds,
}: {
  value: number;
  max: number;
  min: number;
  size: number;
  thresholds?: { warning?: number; danger?: number };
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercentage / 100) * circumference;

  const getColor = () => {
    if (thresholds?.danger && percentage >= thresholds.danger) {
      return 'rgb(239, 68, 68)'; // red
    }
    if (thresholds?.warning && percentage >= thresholds.warning) {
      return 'rgb(251, 146, 60)'; // orange
    }
    return 'rgb(34, 197, 94)'; // green
  };

  const color = getColor();

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgb(229, 231, 235)"
        strokeWidth="10"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
};

export const MetricGauge = ({
  title,
  value,
  max = 100,
  min = 0,
  unit = '%',
  description,
  className,
  size = 'md',
  thresholds,
}: MetricGaugeProps) => {
  const sizeConfig = {
    sm: { gauge: 120, text: 'text-2xl' },
    md: { gauge: 180, text: 'text-4xl' },
    lg: { gauge: 240, text: 'text-5xl' },
  };

  const config = sizeConfig[size];
  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const getStatusColor = useMemo(() => {
    if (thresholds?.danger && percentage >= thresholds.danger) {
      return 'text-red-500';
    }
    if (thresholds?.warning && percentage >= thresholds.warning) {
      return 'text-orange-500';
    }
    return 'text-green-500';
  }, [percentage, thresholds]);

  const getStatusLabel = useMemo(() => {
    if (thresholds?.danger && percentage >= thresholds.danger) {
      return 'Critical';
    }
    if (thresholds?.warning && percentage >= thresholds.warning) {
      return 'Warning';
    }
    return 'Normal';
  }, [percentage, thresholds]);

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative inline-flex items-center justify-center">
          <GaugeCircle
            value={value}
            max={max}
            min={min}
            size={config.gauge}
            thresholds={thresholds}
          />
          <div className="absolute flex flex-col items-center">
            <div className={cn('font-bold', config.text, getStatusColor)}>
              {clampedPercentage.toFixed(1)}
              <span className="text-sm ml-1">{unit}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {value.toFixed(2)} / {max}
            </div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
              getStatusColor,
              'bg-opacity-10'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full', getStatusColor.replace('text', 'bg'))} />
            {getStatusLabel}
          </div>
        </div>
        {thresholds && (
          <div className="mt-4 w-full space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Min:</span>
              <span>{min}</span>
            </div>
            {thresholds.warning && (
              <div className="flex justify-between text-orange-600">
                <span>Warning:</span>
                <span>{thresholds.warning}%</span>
              </div>
            )}
            {thresholds.danger && (
              <div className="flex justify-between text-red-600">
                <span>Danger:</span>
                <span>{thresholds.danger}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Max:</span>
              <span>{max}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
