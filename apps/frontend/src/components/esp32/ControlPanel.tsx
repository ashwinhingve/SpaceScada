'use client';

import { useState } from 'react';
import { useESP32Control } from '@/hooks/useESP32Control';
import { ESP32Device } from '@webscada/shared-types';

interface ControlPanelProps {
  device: ESP32Device;
}

export function ControlPanel({ device }: ControlPanelProps) {
  const { sending, error, toggleLED, setLED, requestStatus, rebootDevice } = useESP32Control(
    device.id
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCommand = async (commandFn: () => Promise<void>, successMessage: string) => {
    try {
      await commandFn();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  const ledState = (device as any).controlState?.ledState ?? false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Control</h3>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-green-800 dark:text-green-200 text-sm">Command sent successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-red-800 dark:text-red-200 text-sm">{error.message}</p>
        </div>
      )}

      {/* LED Control */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">LED Control</h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full ${
                ledState ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {ledState ? 'On' : 'Off'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCommand(() => setLED(true), 'LED turned on')}
              disabled={sending}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Turn On
            </button>
            <button
              onClick={() => handleCommand(() => setLED(false), 'LED turned off')}
              disabled={sending}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Turn Off
            </button>
            <button
              onClick={() => handleCommand(toggleLED, 'LED toggled')}
              disabled={sending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Toggle
            </button>
          </div>
        </div>
      </div>

      {/* Device Actions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Device Actions
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => handleCommand(requestStatus, 'Status requested')}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Request Status
          </button>
          <button
            onClick={() => handleCommand(rebootDevice, 'Reboot initiated')}
            disabled={sending}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reboot Device
          </button>
        </div>
      </div>

      {sending && (
        <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Sending command...</span>
        </div>
      )}
    </div>
  );
}
