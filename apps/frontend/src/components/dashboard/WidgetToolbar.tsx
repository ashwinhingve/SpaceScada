'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WIDGET_TEMPLATES } from '@/types/dashboard';
import { useWidgetStore } from '@/stores/widgetStore';
import * as Icons from 'lucide-react';

export function WidgetToolbar() {
  const addWidget = useWidgetStore(state => state.addWidget);
  const widgets = useWidgetStore(state => state.widgets);

  const handleAddWidget = async (templateIndex: number) => {
    const template = WIDGET_TEMPLATES[templateIndex];
    
    // Find next available position
    const maxY = widgets.reduce((max, w) => Math.max(max, w.layout.y + w.layout.h), 0);
    
    const newWidget = {
      widgetKey: `${template.widgetType}-${Date.now()}`,
      widgetType: template.widgetType,
      layout: {
        x: 0,
        y: maxY,
        w: template.defaultLayout.w,
        h: template.defaultLayout.h,
        minW: template.defaultLayout.minW,
        minH: template.defaultLayout.minH,
        maxW: template.defaultLayout.maxW,
        maxH: template.defaultLayout.maxH,
      },
      config: template.defaultConfig as any,
      title: template.name,
      showHeader: true,
      refreshInterval: 5000,
      visible: true,
    };

    await addWidget(newWidget);
  };

  const deviceWidgets = WIDGET_TEMPLATES.filter(t => t.category === 'device');
  const dataWidgets = WIDGET_TEMPLATES.filter(t => t.category === 'data');
  const visualizationWidgets = WIDGET_TEMPLATES.filter(t => t.category === 'visualization');

  return (
    <div className='flex items-center gap-2 mb-4 p-3 bg-[#1E293B] border border-gray-800 rounded-lg'>
      <span className='text-white font-medium text-sm'>Add Widget:</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='border-gray-700 hover:bg-gray-800'>
            <Plus className='h-4 w-4 mr-1' />
            Device Widgets
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='bg-[#1E293B] border-gray-700'>
          <DropdownMenuLabel className='text-gray-400'>Device Monitoring</DropdownMenuLabel>
          <DropdownMenuSeparator className='bg-gray-700' />
          {deviceWidgets.map((template, index) => (
            <DropdownMenuItem
              key={template.widgetType}
              onClick={() => handleAddWidget(WIDGET_TEMPLATES.indexOf(template))}
              className='text-white hover:bg-gray-800 cursor-pointer'
            >
              {template.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='border-gray-700 hover:bg-gray-800'>
            <Plus className='h-4 w-4 mr-1' />
            Data Widgets
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='bg-[#1E293B] border-gray-700'>
          <DropdownMenuLabel className='text-gray-400'>Data Visualization</DropdownMenuLabel>
          <DropdownMenuSeparator className='bg-gray-700' />
          {dataWidgets.map((template) => (
            <DropdownMenuItem
              key={template.widgetType}
              onClick={() => handleAddWidget(WIDGET_TEMPLATES.indexOf(template))}
              className='text-white hover:bg-gray-800 cursor-pointer'
            >
              {template.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm' className='border-gray-700 hover:bg-gray-800'>
            <Plus className='h-4 w-4 mr-1' />
            Visualization
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='bg-[#1E293B] border-gray-700'>
          <DropdownMenuLabel className='text-gray-400'>Visualization</DropdownMenuLabel>
          <DropdownMenuSeparator className='bg-gray-700' />
          {visualizationWidgets.map((template) => (
            <DropdownMenuItem
              key={template.widgetType}
              onClick={() => handleAddWidget(WIDGET_TEMPLATES.indexOf(template))}
              className='text-white hover:bg-gray-800 cursor-pointer'
            >
              {template.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}