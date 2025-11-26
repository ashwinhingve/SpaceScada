'use client';

import React, { useEffect, useState } from 'react';
import { Radio, Signal, Battery, Activity } from 'lucide-react';
import { WidgetContainer } from '../WidgetContainer';
import type { BaseWidgetProps, LoRaWANDeviceWidgetConfig } from '@/types/dashboard';

export function LoRaWANDeviceWidget({ widget, onConfigure, onRemove }: BaseWidgetProps) {
  const config = widget.config as LoRaWANDeviceWidgetConfig;
  const [deviceData, setDeviceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!config.deviceId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/lorawan/devices/${config.deviceId}`);
        if (response.ok) {
          const data = await response.json();
          setDeviceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch LoRaWAN device data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, widget.refreshInterval);
    return () => clearInterval(interval);
  }, [config.deviceId, widget.refreshInterval]);

  const metrics = config.showMetrics || ['rssi', 'snr', 'frameCount', 'joinStatus'];

  return (
    <WidgetContainer widget={widget} onConfigure={onConfigure} onRemove={onRemove}>
      {loading ? (
        <div className='flex items-center justify-center h-full'>
          <div className='text-gray-400'>Loading...</div>
        </div>
      ) : !config.deviceId ? (
        <div className='flex flex-col items-center justify-center h-full text-gray-400'>
          <Radio className='h-12 w-12 mb-2 opacity-50' />
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
          {/* Device Name */}
          <div className='flex items-center gap-2 pb-3 border-b border-gray-700'>
            <Radio className='h-5 w-5 text-blue-400' />
            <div>
              <div className='text-white font-medium'>{deviceData?.name || 'LoRaWAN Device'}</div>
              <div className='text-xs text-gray-400'>{deviceData?.dev_eui || config.deviceId}</div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className='grid grid-cols-2 gap-3'>
            {metrics.includes('rssi') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Signal className='h-4 w-4 text-green-400' />
                  <span className='text-xs text-gray-400'>RSSI</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.rssi || '-'} dBm
                </div>
              </div>
            )}

            {metrics.includes('snr') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Activity className='h-4 w-4 text-blue-400' />
                  <span className='text-xs text-gray-400'>SNR</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.snr || '-'} dB
                </div>
              </div>
            )}

            {metrics.includes('frameCount') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Activity className='h-4 w-4 text-purple-400' />
                  <span className='text-xs text-gray-400'>Frames</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.uplink_frame_count || 0}
                </div>
              </div>
            )}

            {metrics.includes('joinStatus') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Radio className='h-4 w-4 text-orange-400' />
                  <span className='text-xs text-gray-400'>Status</span>
                </div>
                <div className='text-sm font-medium'>
                  {deviceData?.status_info?.joined ? (
                    <span className='text-green-400'>Joined</span>
                  ) : (
                    <span className='text-gray-400'>Not Joined</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className='flex items-center justify-between pt-2 border-t border-gray-700'>
            <span className='text-xs text-gray-400'>Last Uplink</span>
            <span className='text-xs text-white'>
              {deviceData?.status_info?.last_uplink
                ? new Date(deviceData.status_info.last_uplink).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}