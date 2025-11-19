'use client';

import { ESP32SensorData } from '@webscada/shared-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SensorChartProps {
  data: ESP32SensorData[];
  dataKey: 'temperature' | 'humidity' | 'pressure';
  title: string;
  unit: string;
  color?: string;
}

export function SensorChart({ data, dataKey, title, unit, color = '#3b82f6' }: SensorChartProps) {
  const chartData = data.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    value: item[dataKey],
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis dataKey="timestamp" className="text-xs text-gray-600 dark:text-gray-400" />
          <YAxis
            className="text-xs text-gray-600 dark:text-gray-400"
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
            formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, title]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
