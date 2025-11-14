'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DataPoint, DeviceTag } from '@/types/dashboard';

interface DataCardProps {
  tag: DeviceTag;
  history?: DataPoint[];
  className?: string;
}

const Sparkline = ({ data, color = 'rgb(59, 130, 246)' }: { data: number[]; color?: string }) => {
  if (data.length < 2) {
    return (
      <div className="h-12 flex items-center justify-center text-muted-foreground text-xs">
        No data
      </div>
    );
  }

  const width = 120;
  const height = 48;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = height - ((value - min) / range) * (height - 2 * padding) - padding;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fill area under the line */}
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={color}
        fillOpacity="0.1"
        stroke="none"
      />
    </svg>
  );
};

export const DataCard = ({ tag, history = [], className }: DataCardProps) => {
  const { trend, trendPercentage, sparklineData } = useMemo(() => {
    if (history.length < 2) {
      return { trend: 'neutral', trendPercentage: 0, sparklineData: [] };
    }

    const values = history
      .map((point) => {
        const value = point.value;
        return typeof value === 'number' ? value : null;
      })
      .filter((v): v is number => v !== null);

    if (values.length < 2) {
      return { trend: 'neutral', trendPercentage: 0, sparklineData: [] };
    }

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const diff = lastValue - firstValue;
    const percentage = firstValue !== 0 ? (diff / Math.abs(firstValue)) * 100 : 0;

    let trendDirection: 'up' | 'down' | 'neutral';
    if (Math.abs(percentage) < 0.1) {
      trendDirection = 'neutral';
    } else if (diff > 0) {
      trendDirection = 'up';
    } else {
      trendDirection = 'down';
    }

    return {
      trend: trendDirection,
      trendPercentage: Math.abs(percentage),
      sparklineData: values,
    };
  }, [history]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getQualityColor = () => {
    switch (tag.quality) {
      case 'GOOD':
        return 'text-green-600';
      case 'BAD':
        return 'text-red-600';
      case 'UNCERTAIN':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: DeviceTag['value']) => {
    if (value === null) return 'N/A';
    if (typeof value === 'boolean') return value ? 'ON' : 'OFF';
    if (typeof value === 'number') return value.toFixed(2);
    return String(value);
  };

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tag.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {tag.dataType}
              {tag.unit && ` (${tag.unit})`}
            </CardDescription>
          </div>
          <div
            className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              getQualityColor(),
              'bg-opacity-10'
            )}
          >
            {tag.quality}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <div className="text-3xl font-bold mb-1">
              {formatValue(tag.value)}
              {tag.unit && <span className="text-lg text-muted-foreground ml-1">{tag.unit}</span>}
            </div>
            <div className="flex items-center gap-1 text-sm">
              {getTrendIcon()}
              <span className={cn('font-medium', getTrendColor())}>
                {trendPercentage.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-xs">from first reading</span>
            </div>
          </div>
          <div className="ml-4">
            <Sparkline
              data={sparklineData}
              color={
                trend === 'up'
                  ? 'rgb(34, 197, 94)'
                  : trend === 'down'
                    ? 'rgb(239, 68, 68)'
                    : 'rgb(107, 114, 128)'
              }
            />
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Updated: {new Date(tag.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};
