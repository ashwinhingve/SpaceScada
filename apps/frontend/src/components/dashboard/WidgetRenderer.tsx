'use client';

import React from 'react';
import type { DashboardWidget } from '@/types/dashboard';
import { LoRaWANDeviceWidget } from './widgets/LoRaWANDeviceWidget';
import { GSMDeviceWidget } from './widgets/GSMDeviceWidget';
import { WiFiDeviceWidget } from './widgets/WiFiDeviceWidget';
import { BluetoothDeviceWidget } from './widgets/BluetoothDeviceWidget';
import { RealTimeDataWidget } from '@/components/console/RealTimeDataWidget';
import { DeviceStatusPanel } from '@/components/console/DeviceStatusPanel';

interface WidgetRendererProps {
  widget: DashboardWidget;
  onConfigure?: (widgetId: string) => void;
  onRemove?: (widgetId: string) => void;
}

export function WidgetRenderer({ widget, onConfigure, onRemove }: WidgetRendererProps) {
  const baseProps = { widget, onConfigure, onRemove };

  switch (widget.widgetType) {
    case 'lorawan_device':
      return <LoRaWANDeviceWidget {...baseProps} />;
    
    case 'gsm_device':
      return <GSMDeviceWidget {...baseProps} />;
    
    case 'wifi_device':
      return <WiFiDeviceWidget {...baseProps} />;
    
    case 'bluetooth_device':
      return <BluetoothDeviceWidget {...baseProps} />;
    
    case 'realtime_chart':
      // Placeholder - use existing RealTimeDataWidget
      return (
        <div className='bg-[#1E293B] border border-gray-800 rounded-lg p-4 h-full'>
          <h3 className='text-white font-semibold mb-2'>{widget.title}</h3>
          <div className='text-gray-400 text-sm'>Real-time Chart Widget</div>
        </div>
      );
    
    case 'gauge':
      return (
        <div className='bg-[#1E293B] border border-gray-800 rounded-lg p-4 h-full'>
          <h3 className='text-white font-semibold mb-2'>{widget.title}</h3>
          <div className='text-gray-400 text-sm'>Gauge Widget</div>
        </div>
      );
    
    case 'device_list':
      return (
        <div className='bg-[#1E293B] border border-gray-800 rounded-lg p-4 h-full overflow-auto'>
          <h3 className='text-white font-semibold mb-2'>{widget.title}</h3>
          <div className='text-gray-400 text-sm'>Device List Widget</div>
        </div>
      );
    
    case 'status_summary':
      return <DeviceStatusPanel devices={[]} />;
    
    case 'map':
      return (
        <div className='bg-[#1E293B] border border-gray-800 rounded-lg p-4 h-full'>
          <h3 className='text-white font-semibold mb-2'>{widget.title}</h3>
          <div className='text-gray-400 text-sm'>Map Widget</div>
        </div>
      );
    
    default:
      return (
        <div className='bg-[#1E293B] border border-gray-800 rounded-lg p-4 h-full'>
          <div className='text-red-400'>Unknown widget type: {widget.widgetType}</div>
        </div>
      );
  }
}