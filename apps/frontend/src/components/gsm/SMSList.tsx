'use client';

import { SMSMessage, SMSDirection, SMSStatus } from '@webscada/shared-types';
import { formatDistanceToNow } from 'date-fns';

interface SMSListProps {
  messages: SMSMessage[];
  onMessageClick?: (message: SMSMessage) => void;
}

export function SMSList({ messages, onMessageClick }: SMSListProps) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    RECEIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    READ: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };

  const formatTimestamp = (timestamp: Date) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  if (messages.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No messages yet</div>;
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`border rounded-lg p-4 transition-colors ${
            onMessageClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
          } ${
            message.direction === SMSDirection.INBOUND
              ? 'border-blue-200 dark:border-blue-900'
              : 'border-gray-200 dark:border-gray-700'
          }`}
          onClick={() => onMessageClick?.(message)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  message.direction === SMSDirection.INBOUND ? 'bg-blue-500' : 'bg-green-500'
                }`}
              />
              <span className="font-medium">{message.phoneNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[message.status]}`}>
                {message.status}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300">{message.message}</p>

          {message.deliveredAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Delivered {formatTimestamp(message.deliveredAt)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
