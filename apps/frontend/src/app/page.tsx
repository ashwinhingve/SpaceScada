'use client';

import { useEffect, useState } from 'react';

import { DeviceStatus } from '@webscada/shared-types';

export default function Home() {
  const [status, setStatus] = useState<DeviceStatus>(DeviceStatus.OFFLINE);

  useEffect(() => {
    // Simulate device status update
    const timer = setTimeout(() => {
      setStatus(DeviceStatus.ONLINE);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">WebSCADA System</h1>
        <div className="bg-card rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                status === DeviceStatus.ONLINE
                  ? 'bg-green-500'
                  : 'bg-gray-400'
              }`}
            />
            <span className="text-lg">{status}</span>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Devices</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-card rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Active Tags</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-card rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-2">Alarms</h3>
            <p className="text-3xl font-bold text-yellow-500">0</p>
          </div>
        </div>
      </div>
    </main>
  );
}
