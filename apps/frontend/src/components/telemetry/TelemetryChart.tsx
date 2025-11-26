'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface TelemetryDataPoint {
  timestamp: string;
  value: number;
}

interface TelemetryChartProps {
  title: string;
  data: TelemetryDataPoint[];
  unit?: string;
  color?: string;
  height?: number;
}

export function TelemetryChart({
  title,
  data,
  unit = '',
  color = '#3b82f6',
  height = 300,
}: TelemetryChartProps) {
  // Format data for Recharts
  const chartData = data.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    value: point.value,
  }));

  return (
    <Card className="bg-[#1E293B] border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              label={{ value: unit, angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                color: '#fff',
              }}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, 'Value']}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
              activeDot={{ r: 5 }}
              name={title}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
