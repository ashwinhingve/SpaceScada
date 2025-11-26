'use client';

import { useState } from 'react';
import { ESP32SensorType } from '@webscada/shared-types';
import { esp32API, RegisterDeviceRequest } from '@/lib/esp32-api';
import { useRouter } from 'next/navigation';

export function RegisterDeviceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterDeviceRequest>({
    name: '',
    sensorType: ESP32SensorType.TEMPERATURE,
    mqttBroker: 'localhost',
    mqttPort: 1883,
    publishInterval: 5000,
    heartbeatInterval: 15000,
    gpioConfig: {
      dataPin: 4,
      ledPin: 2,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const device = await esp32API.registerDevice(formData);
      router.push(`/esp32/devices/${device.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === 'number' ? (value === '' ? undefined : parseInt(value, 10)) : value;

    if (name.startsWith('gpio.')) {
      const gpioField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        gpioConfig: {
          ...prev.gpioConfig,
          [gpioField]: parsedValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Device Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Office Temperature Sensor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sensor Type *
            </label>
            <select
              name="sensorType"
              required
              value={formData.sensorType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={ESP32SensorType.TEMPERATURE}>Temperature</option>
              <option value={ESP32SensorType.HUMIDITY}>Humidity</option>
              <option value={ESP32SensorType.PRESSURE}>Pressure</option>
              <option value={ESP32SensorType.LIGHT}>Light</option>
              <option value={ESP32SensorType.MOTION}>Motion</option>
              <option value={ESP32SensorType.GAS}>Gas</option>
              <option value={ESP32SensorType.VOLTAGE}>Voltage</option>
              <option value={ESP32SensorType.CURRENT}>Current</option>
              <option value={ESP32SensorType.CUSTOM}>Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* MQTT Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          MQTT Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              MQTT Broker Host
            </label>
            <input
              type="text"
              name="mqttBroker"
              value={formData.mqttBroker}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="localhost or 192.168.1.100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              MQTT Port
            </label>
            <input
              type="number"
              name="mqttPort"
              value={formData.mqttPort}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username (optional)
            </label>
            <input
              type="text"
              name="mqttUsername"
              value={formData.mqttUsername || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password (optional)
            </label>
            <input
              type="password"
              name="mqttPassword"
              value={formData.mqttPassword || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* GPIO Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          GPIO Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sensor Data Pin (GPIO)
            </label>
            <input
              type="number"
              name="gpio.dataPin"
              value={formData.gpioConfig?.dataPin || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              LED Pin (GPIO)
            </label>
            <input
              type="number"
              name="gpio.ledPin"
              value={formData.gpioConfig?.ledPin || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2"
            />
          </div>
        </div>
      </div>

      {/* Timing Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Timing Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Publish Interval (ms)
            </label>
            <input
              type="number"
              name="publishInterval"
              value={formData.publishInterval}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="5000"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How often to publish sensor data (milliseconds)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Heartbeat Interval (ms)
            </label>
            <input
              type="number"
              name="heartbeatInterval"
              value={formData.heartbeatInterval}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="15000"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How often to send heartbeat (milliseconds)
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Registering...' : 'Register Device'}
        </button>
      </div>
    </form>
  );
}
