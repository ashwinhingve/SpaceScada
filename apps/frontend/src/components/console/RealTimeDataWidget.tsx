'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

interface RealTimeDataWidgetProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  chartType?: 'line' | 'area' | 'bar';
  color?: string;
  showTrend?: boolean;
  refreshInterval?: number;
  minValue?: number;
  maxValue?: number;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export function RealTimeDataWidget({
  title,
  data,
  unit = '',
  chartType = 'line',
  color = '#3b82f6',
  showTrend = true,
  refreshInterval = 5000,
  minValue,
  maxValue,
  thresholds,
}: RealTimeDataWidgetProps) {
  const [liveData, setLiveData] = useState(data);

  useEffect(() => {
    setLiveData(data);
  }, [data]);

  const getCurrentValue = () => {
    if (liveData.length === 0) return 0;
    return liveData[liveData.length - 1].value;
  };

  const getTrend = () => {
    if (liveData.length < 2) return 'stable';
    const current = liveData[liveData.length - 1].value;
    const previous = liveData[liveData.length - 2].value;
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const getTrendIcon = () => {
    const trend = getTrend();
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      default:
        return <Minus className="h-5 w-5 text-gray-400" />;
    }
  };

  const getValueStatus = () => {
    const value = getCurrentValue();
    if (thresholds?.critical && value >= thresholds.critical) {
      return { color: 'text-red-400', bg: 'bg-red-500/20' };
    }
    if (thresholds?.warning && value >= thresholds.warning) {
      return { color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }
    return { color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const renderChart = () => {
    const chartProps = {
      data: liveData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={[minValue ?? 'auto', maxValue ?? 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
              }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={[minValue ?? 'auto', maxValue ?? 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
              }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      default:
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={[minValue ?? 'auto', maxValue ?? 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
              }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        );
    }
  };

  const status = getValueStatus();

  return (
    <Card className="bg-[#1E293B] border-gray-800">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${status.color}`}>
                {getCurrentValue().toFixed(2)}
              </span>
              <span className="text-gray-400 text-sm">{unit}</span>
            </div>
          </div>

          {/* Trend Indicator */}
          {showTrend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${status.bg}`}>
              {getTrendIcon()}
              <span className={`text-xs font-medium ${status.color}`}>
                {getTrend().toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-gray-400">
              Live • Updates every {refreshInterval / 1000}s
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Thresholds */}
        {thresholds && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs">
              {thresholds.warning && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <span className="text-gray-400">
                    Warning: {thresholds.warning}{unit}
                  </span>
                </div>
              )}
              {thresholds.critical && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-gray-400">
                    Critical: {thresholds.critical}{unit}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
