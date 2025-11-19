'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gsmApiClient } from '@/lib/gsm-api';
import { GSMDevice, GSMNetworkStatus, GPSLocation, SMSMessage } from '@webscada/shared-types';
import { NetworkStatusCard } from '@/components/gsm/NetworkStatusCard';
import { GPSMap } from '@/components/gsm/GPSMap';
import { SMSList } from '@/components/gsm/SMSList';
import Link from 'next/link';

export default function GSMDevicePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [device, setDevice] = useState<GSMDevice | null>(null);
  const [networkStatus, setNetworkStatus] = useState<GSMNetworkStatus | null>(null);
  const [gpsLocation, setGPSLocation] = useState<GPSLocation | null>(null);
  const [recentSMS, setRecentSMS] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if id is "new" (should go to new page instead)
  useEffect(() => {
    if (id === 'new') {
      router.replace('/gsm/new');
      return;
    }
  }, [id, router]);

  const loadDeviceData = async () => {
    if (!id || id === 'new') return;

    try {
      setLoading(true);

      // Load device details
      const deviceResponse = await gsmApiClient.getDevice(id);
      if (deviceResponse.success && deviceResponse.data) {
        setDevice(deviceResponse.data);
      }

      // Load network status
      const networkResponse = await gsmApiClient.getNetworkStatus(id);
      if (networkResponse.success && networkResponse.data) {
        setNetworkStatus(networkResponse.data);
      }

      // Load GPS location
      const gpsResponse = await gsmApiClient.getGPSLocation(id);
      if (gpsResponse.success && gpsResponse.data) {
        setGPSLocation(gpsResponse.data);
      }

      // Load recent SMS
      const smsResponse = await gsmApiClient.getSMSMessages(id, { limit: 5 });
      if (smsResponse.success && smsResponse.data) {
        setRecentSMS(smsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDeviceData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (id) {
      loadDeviceData();

      // Auto-refresh every 30 seconds
      const interval = setInterval(loadDeviceData, 30000);
      return () => clearInterval(interval);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-purple-600 dark:text-purple-400 font-semibold">
            Loading GSM device...
          </p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-600 dark:text-rose-400 mb-4 font-semibold">Device not found</p>
          <Link
            href="/gsm"
            className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
          >
            Back to GSM devices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-900 dark:text-purple-300">
              {device.name}
            </h1>
            <p className="text-purple-600 dark:text-purple-400 font-medium">
              {device.protocol} Device
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-md hover:shadow-lg transition-all"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Status</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {device.status}
            </p>
          </div>
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Signal</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {networkStatus?.signalStrength || 0}%
            </p>
          </div>
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">GPS Fix</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {gpsLocation?.fix.replace('_', ' ') || 'Unknown'}
            </p>
          </div>
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Messages</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {recentSMS.length}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Status */}
          {networkStatus && (
            <div>
              <NetworkStatusCard status={networkStatus} />
            </div>
          )}

          {/* GPS Location */}
          {gpsLocation && (
            <div>
              <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-bold mb-4 text-purple-900 dark:text-purple-200">
                  GPS Location
                </h3>
                <GPSMap location={gpsLocation} height="300px" />
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      Latitude:
                    </span>
                    <span className="ml-2 font-mono text-purple-900 dark:text-purple-200">
                      {gpsLocation.latitude.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      Longitude:
                    </span>
                    <span className="ml-2 font-mono text-purple-900 dark:text-purple-200">
                      {gpsLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                  {gpsLocation.altitude && (
                    <div>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        Altitude:
                      </span>
                      <span className="ml-2 text-purple-900 dark:text-purple-200">
                        {gpsLocation.altitude.toFixed(1)}m
                      </span>
                    </div>
                  )}
                  {gpsLocation.speed && (
                    <div>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        Speed:
                      </span>
                      <span className="ml-2 text-purple-900 dark:text-purple-200">
                        {gpsLocation.speed.toFixed(1)} km/h
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/gsm/${id}/gps`}
                    className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-semibold"
                  >
                    View full GPS tracking →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent SMS */}
          <div className="lg:col-span-2">
            <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200">
                  Recent SMS Messages
                </h3>
                <Link
                  href={`/gsm/${id}/sms`}
                  className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-semibold"
                >
                  View all →
                </Link>
              </div>
              <SMSList messages={recentSMS} />
              {recentSMS.length === 0 && (
                <p className="text-center text-purple-600 dark:text-purple-400 py-8 font-medium">
                  No SMS messages yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/gsm/${id}/sms`}
            className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
          >
            <h4 className="font-bold mb-2 text-purple-900 dark:text-purple-200">Send SMS</h4>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Send and manage SMS messages
            </p>
          </Link>

          <Link
            href={`/gsm/${id}/gps`}
            className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
          >
            <h4 className="font-bold mb-2 text-purple-900 dark:text-purple-200">GPS Tracking</h4>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              View location history and tracking
            </p>
          </Link>

          <Link
            href={`/gsm/${id}/network`}
            className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
          >
            <h4 className="font-bold mb-2 text-purple-900 dark:text-purple-200">Network Monitor</h4>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              View network statistics and history
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
