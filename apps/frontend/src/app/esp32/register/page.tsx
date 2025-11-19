'use client';

import Link from 'next/link';
import { RegisterDeviceForm } from '@/components/esp32/RegisterDeviceForm';

export default function RegisterDevicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/esp32"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Devices
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Register ESP32 Device
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configure your ESP32 device settings before flashing the firmware
          </p>
        </div>

        {/* Form */}
        <RegisterDeviceForm />

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Next Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>After registration, note the Device ID that will be generated</li>
            <li>
              Open the ESP32 firmware file (
              <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                esp32-firmware/webscada-esp32.ino
              </code>
              )
            </li>
            <li>Update the configuration with your WiFi credentials and Device ID</li>
            <li>Flash the firmware to your ESP32 board using Arduino IDE</li>
            <li>The device will appear online within 15 seconds of booting</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Make sure your MQTT broker is running and accessible from your
              ESP32 device. For local testing, use your computer&apos;s IP address (not
              &quot;localhost&quot;).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
