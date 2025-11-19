'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DataPoint, DeviceTag } from '@/types/dashboard';

interface TrendChartProps {
  title: string;
  description?: string;
  tags: DeviceTag[];
  history: Map<string, DataPoint[]>;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

const CHART_COLORS = [
  'rgb(59, 130, 246)', // blue
  'rgb(34, 197, 94)', // green
  'rgb(249, 115, 22)', // orange
  'rgb(168, 85, 247)', // purple
  'rgb(236, 72, 153)', // pink
  'rgb(14, 165, 233)', // cyan
];

interface ChartDataPoint {
  timestamp: number;
  formattedTime: string;
  [key: string]: number | string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const TrendChart = ({
  title,
  description,
  tags,
  history,
  className,
  height = 300,
  showLegend = true,
  showGrid = true,
}: TrendChartProps) => {
  const chartData = useMemo(() => {
    // Create a unified timeline from all tag histories
    const timeMap = new Map<number, ChartDataPoint>();

    tags.forEach((tag) => {
      const tagHistory = history.get(tag.id) || [];
      tagHistory.forEach((point) => {
        const timestamp = new Date(point.timestamp).getTime();

        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, {
            timestamp,
            formattedTime: new Date(point.timestamp).toLocaleTimeString(),
          });
        }

        const dataPoint = timeMap.get(timestamp);
        if (dataPoint && typeof point.value === 'number') {
          dataPoint[tag.id] = point.value;
        }
      });
    });

    // Convert to sorted array
    return Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [tags, history]);

  const visibleTags = useMemo(() => {
    return tags.filter((tag) => tag.dataType === 'FLOAT' || tag.dataType === 'INTEGER');
  }, [tags]);

  if (visibleTags.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No numeric data available to display
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Waiting for data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis
              dataKey="formattedTime"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickMargin={10}
            />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickMargin={10} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="line"
                formatter={(value) => {
                  const tag = visibleTags.find((t) => t.id === value);
                  return tag ? `${tag.name} ${tag.unit ? `(${tag.unit})` : ''}` : value;
                }}
              />
            )}
            {visibleTags.map((tag, index) => (
              <Line
                key={tag.id}
                type="monotone"
                dataKey={tag.id}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name={tag.id}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
