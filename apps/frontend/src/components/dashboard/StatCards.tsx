'use client';

import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCard {
  id: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export interface StatCardsProps {
  stats: StatCard[];
  className?: string;
}

export function StatCards({ stats, className }: StatCardsProps) {
  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
        className
      )}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.id}
            className="border-border/40 overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, ${stat.bgColor}15 0%, ${stat.bgColor}05 100%)`,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div
                    className="rounded-full p-3 w-fit mb-3"
                    style={{ backgroundColor: `${stat.bgColor}30` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  {stat.unit && (
                    <div className="text-xs text-muted-foreground mt-1">({stat.unit})</div>
                  )}
                </div>
              </div>
              {stat.trend && (
                <div
                  className={`flex items-center gap-1 mt-3 text-sm font-medium ${
                    stat.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {stat.trend.direction === 'up' ? '↑' : '↓'}
                  {Math.abs(stat.trend.value)}%
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
