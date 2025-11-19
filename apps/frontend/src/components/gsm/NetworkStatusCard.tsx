'use client';

import { GSMNetworkStatus } from '@webscada/shared-types';
import { SignalStrengthIndicator } from './SignalStrengthIndicator';

interface NetworkStatusCardProps {
  status: GSMNetworkStatus;
}

export function NetworkStatusCard({ status }: NetworkStatusCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const networkTypeLabel = {
    GSM: '2G',
    GPRS: '2.5G',
    EDGE: '2.75G',
    UMTS: '3G',
    HSDPA: '3.5G',
    LTE: '4G',
    LTE_CAT1: '4G Cat-1',
    UNKNOWN: 'Unknown',
  };

  const simStatusColors = {
    READY: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    PIN_REQUIRED: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    PUK_REQUIRED: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    NOT_INSERTED: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
    ERROR: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Network Status</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{status.operator}</p>
        </div>
        <SignalStrengthIndicator strength={status.signalStrength} quality={status.signalQuality} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Network Type</p>
          <p className="font-medium">{networkTypeLabel[status.networkType]}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Registration</p>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                status.registered ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <p className="font-medium">{status.registered ? 'Registered' : 'Not Registered'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Roaming</p>
          <p className="font-medium">{status.roaming ? 'Yes' : 'No'}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">SIM Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
              simStatusColors[status.simStatus]
            }`}
          >
            {status.simStatus.replace('_', ' ')}
          </span>
        </div>

        {status.ipAddress && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
            <p className="font-medium font-mono text-sm">{status.ipAddress}</p>
          </div>
        )}

        {status.dataUsage && (
          <>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Data Sent</p>
              <p className="font-medium">{formatBytes(status.dataUsage.sentBytes)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Data Received</p>
              <p className="font-medium">{formatBytes(status.dataUsage.receivedBytes)}</p>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">IMEI:</span>
            <span className="ml-2 font-mono">{status.imei}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">ICCID:</span>
            <span className="ml-2 font-mono">{status.iccid}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
