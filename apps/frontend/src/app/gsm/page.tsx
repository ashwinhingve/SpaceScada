'use client';

import { useEffect, useState } from 'react';
import { gsmApiClient } from '@/lib/gsm-api';
import { GSMDevice } from '@webscada/shared-types';
import Link from 'next/link';
import { Smartphone, Signal, MapPin, MessageSquare, Plus } from 'lucide-react';

export default function GSMDevicesPage() {
  const [devices, setDevices] = useState<GSMDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await gsmApiClient.listDevices();
        if (response.success && response.data) {
          setDevices(response.data);
        }
      } catch (error) {
        console.error('Failed to load GSM devices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-purple-600 dark:text-purple-400 font-semibold">
            Loading GSM devices...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Smartphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            GSM Devices
          </h1>
          <p className="text-purple-600 dark:text-purple-400 mt-1 font-medium">
            Manage your A7670C GSM/GPRS/GPS modules
          </p>
        </div>
        <Link
          href="/gsm/new"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add GSM Device
        </Link>
      </div>

      {/* Device List */}
      {devices.length === 0 ? (
        <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-12 text-center bg-purple-50 dark:bg-purple-900/20">
          <Smartphone className="w-16 h-16 mx-auto text-purple-400 dark:text-purple-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-purple-900 dark:text-purple-200">
            No GSM devices yet
          </h2>
          <p className="text-purple-600 dark:text-purple-400 mb-4">
            Get started by adding your first A7670C GSM module
          </p>
          <Link
            href="/gsm/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add GSM Device
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Link
              key={device.id}
              href={`/gsm/${device.id}`}
              className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6 hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-500 transition-all bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200">
                    {device.name}
                  </h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {device.protocol}
                  </p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    device.status === 'ONLINE'
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                      : device.status === 'OFFLINE'
                        ? 'bg-gray-400'
                        : 'bg-rose-500'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Signal className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-purple-700 dark:text-purple-300 font-medium">
                    {device.networkStatus
                      ? `${device.networkStatus.signalStrength}% - ${device.networkStatus.signalQuality}`
                      : 'No signal data'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-purple-700 dark:text-purple-300 font-medium">
                    {device.gpsLocation
                      ? `${device.gpsLocation.latitude.toFixed(4)}, ${device.gpsLocation.longitude.toFixed(4)}`
                      : 'No GPS data'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span className="text-purple-700 dark:text-purple-300 font-medium">
                    {device.gsmConfig.phoneNumber || 'No phone number'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-medium">
                  <span>
                    Last seen:{' '}
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {devices.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
              Total Devices
            </p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {devices.length}
            </p>
          </div>
          <div className="border-2 border-emerald-200 dark:border-emerald-700 rounded-lg p-4 bg-emerald-50 dark:bg-emerald-900/20">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Online</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {devices.filter((d) => d.status === 'ONLINE').length}
            </p>
          </div>
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">Offline</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
              {devices.filter((d) => d.status === 'OFFLINE').length}
            </p>
          </div>
          <div className="border-2 border-rose-200 dark:border-rose-700 rounded-lg p-4 bg-rose-50 dark:bg-rose-900/20">
            <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">Error</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {devices.filter((d) => d.status === 'ERROR').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
