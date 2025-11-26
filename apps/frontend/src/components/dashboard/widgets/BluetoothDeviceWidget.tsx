'use client';

import React, { useEffect, useState } from 'react';
import { Bluetooth, Signal, Battery, MapPin } from 'lucide-react';
import { WidgetContainer } from '../WidgetContainer';
import type { BaseWidgetProps, BluetoothDeviceWidgetConfig } from '@/types/dashboard';

export function BluetoothDeviceWidget({ widget, onConfigure, onRemove }: BaseWidgetProps) {
  const config = widget.config as BluetoothDeviceWidgetConfig;
  const [deviceData, setDeviceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!config.deviceId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/bluetooth/devices/${config.deviceId}`);
        if (response.ok) {
          const data = await response.json();
          setDeviceData(data);
        }
      } catch (error) {
        console.error('Failed to fetch Bluetooth device data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, widget.refreshInterval);
    return () => clearInterval(interval);
  }, [config.deviceId, widget.refreshInterval]);

  const metrics = config.showMetrics || ['rssi', 'battery', 'proximity'];

  return (
    <WidgetContainer widget={widget} onConfigure={onConfigure} onRemove={onRemove}>
      {loading ? (
        <div className='flex items-center justify-center h-full'>
          <div className='text-gray-400'>Loading...</div>
        </div>
      ) : !config.deviceId ? (
        <div className='flex flex-col items-center justify-center h-full text-gray-400'>
          <Bluetooth className='h-12 w-12 mb-2 opacity-50' />
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
            <Bluetooth className='h-5 w-5 text-purple-400' />
            <div>
              <div className='text-white font-medium'>{deviceData?.name || 'Bluetooth Device'}</div>
              <div className='text-xs text-gray-400'>{deviceData?.config?.mac_address || config.deviceId}</div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            {metrics.includes('rssi') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Signal className='h-4 w-4 text-purple-400' />
                  <span className='text-xs text-gray-400'>RSSI</span>
                </div>
                <div className='text-lg font-bold text-white'>
                  {deviceData?.status_info?.rssi || '-'} dBm
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
                  {deviceData?.status_info?.battery_level || '-'}%
                </div>
              </div>
            )}

            {metrics.includes('proximity') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <MapPin className='h-4 w-4 text-blue-400' />
                  <span className='text-xs text-gray-400'>Proximity</span>
                </div>
                <div className='text-sm font-medium text-white capitalize'>
                  {deviceData?.status_info?.proximity_zone || 'Unknown'}
                </div>
              </div>
            )}

            {metrics.includes('bonded') && (
              <div className='bg-gray-800/50 rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Bluetooth className='h-4 w-4 text-green-400' />
                  <span className='text-xs text-gray-400'>Bonded</span>
                </div>
                <div className='text-sm font-medium'>
                  {deviceData?.status_info?.bonded ? (
                    <span className='text-green-400'>Yes</span>
                  ) : (
                    <span className='text-gray-400'>No</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className='flex items-center justify-between pt-2 border-t border-gray-700'>
            <span className='text-xs text-gray-400'>Protocol</span>
            <span className='text-xs text-white'>
              {deviceData?.config?.protocol || 'BLE'}
            </span>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}