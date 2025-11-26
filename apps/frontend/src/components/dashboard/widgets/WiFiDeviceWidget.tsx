'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, Signal, Activity, Clock } from 'lucide-react';
import { WidgetContainer } from '../WidgetContainer';
import type { BaseWidgetProps, WiFiDeviceWidgetConfig } from '@/types/dashboard';

export function WiFiDeviceWidget({ widget, onConfigure, onRemove }: BaseWidgetProps) {
  const config = widget.config as WiFiDeviceWidgetConfig;
  const [deviceData, setDeviceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!config.deviceId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/wifi/devices/${config.deviceId}`);
        if (response.ok) {
          const data = await response.json();
          setDeviceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch WiFi device data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, widget.refreshInterval);
    return () => clearInterval(interval);
  }, [config.deviceId, widget.refreshInterval]);

  const metrics = config.showMetrics || ['signalStrength', 'bandwidth', 'latency'];

  return (
    <WidgetContainer widget={widget} onConfigure={onConfigure} onRemove={onRemove}>
      {loading ? (
        <div className='flex items-center justify-center h-full'>
          <div className='text-gray-400'>Loading...</div>
        </div>
      ) : !config.deviceId ? (
        <div className='flex flex-col items-center justify-center h-full text-gray-400'>
          <Wifi className='h-12 w-12 mb-2 opacity-50' />
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
            <Wifi className='h-5 w-5 text-blue-400' />
            <div>
              <div className='text-white font-medium'>{deviceData?.name || 'WiFi Device'}</div>
              <div className='text-xs text-gray-400'>{deviceData?.config?.mac_address || config.deviceId}</div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {metrics.includes('signalStrength') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Signal className='h-4 w-4 text-blue-400' />
                  <span className='text-xs text-gray-400'>Signal</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.signal_strength || '-'}%
                </div>
              </div>
            )}

            {metrics.includes('bandwidth') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Activity className='h-4 w-4 text-green-400' />
                  <span className='text-xs text-gray-400'>Bandwidth</span>
                </div>
                <div className='text-sm font-bold text-white'>
                  {deviceData?.status_info?.bandwidth_usage 
                    ? (deviceData.status_info.bandwidth_usage / 1024).toFixed(1) + ' KB/s'
                    : 'N/A'}
                </div>
              </div>
            )}

            {metrics.includes('latency') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Clock className='h-4 w-4 text-yellow-400' />
                  <span className='text-xs text-gray-400'>Latency</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.latency || '-'} ms
                </div>
              </div>
            )}

            {metrics.includes('packetLoss') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Activity className='h-4 w-4 text-red-400' />
                  <span className='text-xs text-gray-400'>Packet Loss</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.packet_loss || 0}%
                </div>
              </div>
            )}
          </div>

          <div className='flex items-center justify-between pt-2 border-t border-gray-700'>
            <span className='text-xs text-gray-400'>IP Address</span>
            <span className='text-xs text-white'>
              {deviceData?.status_info?.ip_address || 'N/A'}
            </span>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}