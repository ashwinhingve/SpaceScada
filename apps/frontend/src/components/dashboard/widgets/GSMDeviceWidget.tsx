'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Signal, Battery, Network, Activity } from 'lucide-react';
import { WidgetContainer } from '../WidgetContainer';
import type { BaseWidgetProps, GSMDeviceWidgetConfig } from '@/types/dashboard';

export function GSMDeviceWidget({ widget, onConfigure, onRemove }: BaseWidgetProps) {
  const config = widget.config as GSMDeviceWidgetConfig;
  const [deviceData, setDeviceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!config.deviceId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/gsm/devices/${config.deviceId}`);
        if (response.ok) {
          const data = await response.json();
          setDeviceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch GSM device data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, widget.refreshInterval);
    return () => clearInterval(interval);
  }, [config.deviceId, widget.refreshInterval]);

  const metrics = config.showMetrics || ['signalStrength', 'network', 'battery'];

  return (
    <WidgetContainer widget={widget} onConfigure={onConfigure} onRemove={onRemove}>
      {loading ? (
        <div className='flex items-center justify-center h-full'>
          <div className='text-gray-400'>Loading...</div>
        </div>
      ) : !config.deviceId ? (
        <div className='flex flex-col items-center justify-center h-full text-gray-400'>
          <Smartphone className='h-12 w-12 mb-2 opacity-50' />
          <p className='text-sm'>No device selected</p>
          <button
            onClick={() => onConfigure?.(widget.id)}
            className='mt-2 text-blue-400 text-sm hover:underline'
          >
            Configure widget
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center gap-2 pb-3 border-b border-gray-700'>
            <Smartphone className='h-5 w-5 text-green-400' />
            <div>
              <div className='text-white font-medium'>{deviceData?.name || 'GSM Device'}</div>
              <div className='text-xs text-gray-400'>{deviceData?.config?.imei || config.deviceId}</div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {metrics.includes('signalStrength') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Signal className='h-4 w-4 text-green-400' />
                  <span className='text-xs text-gray-400'>Signal</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.signal_strength || '-'} dBm
                </div>
              </div>
            )}

            {metrics.includes('network') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Network className='h-4 w-4 text-blue-400' />
                  <span className='text-xs text-gray-400'>Network</span>
                </div>
                <div className='text-sm font-bold text-white'>
                  {deviceData?.status_info?.network_type || 'N/A'}
                </div>
              </div>
            )}

            {metrics.includes('battery') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Battery className='h-4 w-4 text-yellow-400' />
                  <span className='text-xs text-gray-400'>Battery</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.battery_percentage || '-'}%
                </div>
              </div>
            )}

            {metrics.includes('dataUsage') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Activity className='h-4 w-4 text-purple-400' />
                  <span className='text-xs text-gray-400'>Data</span>
                </div>
                <div className='text-xs font-medium text-white'>
                  {deviceData?.status_info?.bytes_sent ? 
                    (deviceData.status_info.bytes_sent / 1024).toFixed(1) + ' KB' : 'N/A'}
                </div>
              </div>
            )}
          </div>

          <div className='flex items-center justify-between pt-2 border-t border-gray-700'>
            <span className='text-xs text-gray-400'>Operator</span>
            <span className='text-xs text-white'>
              {deviceData?.status_info?.operator || 'N/A'}
            </span>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}