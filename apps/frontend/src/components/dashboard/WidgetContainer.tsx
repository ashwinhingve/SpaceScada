'use client';

import React from 'react';
import { X, Settings, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DashboardWidget } from '@/types/dashboard';

interface WidgetContainerProps {
  widget: DashboardWidget;
  onConfigure?: (widgetId: string) => void;
  onRemove?: (widgetId: string) => void;
  children: React.ReactNode;
}

export function WidgetContainer({ widget, onConfigure, onRemove, children }: WidgetContainerProps) {
  return (
    <Card className='bg-[#1E293B] border-gray-800 h-full flex flex-col overflow-hidden'>
      {widget.showHeader && (
        <div className='flex items-center justify-between px-4 py-3 border-b border-gray-800 cursor-move'>
          <div className='flex items-center gap-2'>
            <GripVertical className='h-4 w-4 text-gray-500' />
            <h3 className='text-white font-semibold text-sm'>{widget.title || 'Widget'}</h3>
          </div>
          <div className='flex items-center gap-1'>
            {onConfigure && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0 hover:bg-gray-700'
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure(widget.id);
                }}
              >
                <Settings className='h-3.5 w-3.5 text-gray-400' />
              </Button>
            )}
            {onRemove && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0 hover:bg-gray-700 hover:text-red-400'
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(widget.id);
                }}
              >
                <X className='h-3.5 w-3.5 text-gray-400' />
              </Button>
            )}
          </div>
        </div>
      )}
      <div className='flex-1 overflow-auto p-4'>
        {children}
      </div>
    </Card>
  );
}