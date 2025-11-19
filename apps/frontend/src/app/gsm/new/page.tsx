'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gsmApiClient } from '@/lib/gsm-api';
import { GSMDevice, DeviceType, DeviceStatus, ProtocolType } from '@webscada/shared-types';
import Link from 'next/link';
import { ArrowLeft, Save, Smartphone } from 'lucide-react';

export default function NewGSMDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '80',
    apn: '',
    simPin: '',
    phoneNumber: '',
    username: '',
    password: '',
    protocol: 'GSM_HTTP' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const device: GSMDevice = {
        id: `gsm-${Date.now()}`, // Generate unique ID
        name: formData.name,
        type: DeviceType.GATEWAY,
        status: DeviceStatus.OFFLINE,
        protocol: formData.protocol as ProtocolType,
        connectionConfig: {
          host: formData.host,
          port: parseInt(formData.port),
          timeout: 30000,
        },
        gsmConfig: {
          apn: formData.apn,
          simPin: formData.simPin || undefined,
          authMethod: 'PAP',
          username: formData.username || undefined,
          password: formData.password || undefined,
          phoneNumber: formData.phoneNumber || undefined,
        },
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await gsmApiClient.registerDevice(device);

      if (response.success) {
        // Redirect to the device page
        router.push(`/gsm/${device.id}`);
      } else {
        setError(response.error?.message || 'Failed to register device');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/gsm"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline mb-4 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to GSM Devices
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Smartphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Add New GSM Device
          </h1>
          <p className="text-purple-600 dark:text-purple-400 mt-1 font-medium">
            Register your A7670C GSM/GPRS/GPS module
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-100 dark:bg-rose-900/20 border-2 border-rose-400 dark:border-rose-800 rounded-lg">
            <p className="text-rose-800 dark:text-rose-400 font-semibold">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-200">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                  Device Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., My A7670C Module"
                  className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                  Protocol <span className="text-rose-500">*</span>
                </label>
                <select
                  name="protocol"
                  value={formData.protocol}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                >
                  <option value="GSM_HTTP">GSM HTTP</option>
                  <option value="GSM_MQTT">GSM MQTT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Connection Settings */}
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-200">
              Connection Settings
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                    Host/IP Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 192.168.1.100"
                    className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                  />
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                    IP address or hostname of your GSM module
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                    Port <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    required
                    placeholder="80"
                    className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GSM Configuration */}
          <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-200">
              GSM Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                  APN (Access Point Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="apn"
                  value={formData.apn}
                  onChange={handleChange}
                  required
                  placeholder="e.g., internet, web.gprs.mtnnigeria.net"
                  className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                />
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                  Your mobile carrier's APN (e.g., "internet" for most carriers)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                    SIM PIN (Optional)
                  </label>
                  <input
                    type="text"
                    name="simPin"
                    value={formData.simPin}
                    onChange={handleChange}
                    placeholder="e.g., 1234"
                    maxLength={8}
                    className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="e.g., +1234567890"
                    className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                    APN Username (Optional)
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Usually not required"
                    className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-purple-700 dark:text-purple-300">
                    APN Password (Optional)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Usually not required"
                    className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-2">
              💡 Quick Setup Tips
            </h3>
            <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1 font-medium">
              <li>• Make sure your A7670C module is powered on and has a valid SIM card</li>
              <li>• The APN is usually "internet" for most carriers</li>
              <li>• Leave username/password blank unless your carrier requires them</li>
              <li>• For local testing, use your module's IP address (e.g., 192.168.1.100)</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Registering...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Register Device
                </>
              )}
            </button>

            <Link
              href="/gsm"
              className="px-6 py-3 border-2 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center justify-center font-bold transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
