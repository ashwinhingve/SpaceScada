'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  thresholds?: {
    warning?: number;
    danger?: number;
  };
  size?: number;
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  unit = '',
  thresholds = { warning: 70, danger: 90 },
  size = 200,
}: GaugeChartProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180 - 90;

  const getColor = () => {
    if (thresholds.danger && percentage >= thresholds.danger) {
      return '#ef4444';
    }
    if (thresholds.warning && percentage >= thresholds.warning) {
      return '#f59e0b';
    }
    return '#10b981';
  };

  const color = getColor();
  const radius = size / 2 - 10;
  const strokeWidth = 20;

  // Calculate arc path
  const centerX = size / 2;
  const centerY = size / 2;

  const startAngle = -90 * (Math.PI / 180);
  const endAngle = (angle * Math.PI) / 180;

  const x1 = centerX + radius * Math.cos(startAngle);
  const y1 = centerY + radius * Math.sin(startAngle);
  const x2 = centerX + radius * Math.cos(endAngle);
  const y2 = centerY + radius * Math.sin(endAngle);

  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

  // Needle coordinates
  const needleLength = radius - 20;
  const needleX = centerX + needleLength * Math.cos(endAngle);
  const needleY = centerY + needleLength * Math.sin(endAngle);

  return (
    <Card className="border-border/40">
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="flex flex-col items-center">
        <svg width={size} height={size * 0.7} className="overflow-visible">
          {/* Background arc */}
          <path
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${
              centerX + radius * Math.cos((90 * Math.PI) / 180)
            } ${centerY + radius * Math.sin((90 * Math.PI) / 180)}`}
            fill="none"
            stroke="#374151"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value arc */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'all 0.5s ease' }}
          />

          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transition: 'all 0.5s ease' }}
          />

          {/* Center circle */}
          <circle cx={centerX} cy={centerY} r="8" fill={color} />
        </svg>

        <div className="text-center mt-4">
          <div className="text-4xl font-bold" style={{ color }}>
            {value.toFixed(1)}
            {unit && <span className="text-2xl ml-1">{unit}</span>}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Range: {min} - {max} {unit}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
