'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, Download } from 'lucide-react';

type LogLevel = 'all' | 'debug' | 'info' | 'warning' | 'error' | 'critical';

interface LogEntry {
  id: string;
  log_level: LogLevel;
  event_type: string;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface LogsViewerProps {
  logs: LogEntry[];
  onRefresh?: () => void;
  onExport?: () => void;
  loading?: boolean;
}

export function LogsViewer({ logs, onRefresh, onExport, loading = false }: LogsViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<LogLevel>('all');

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-500 bg-red-500/10';
      case 'error':
        return 'text-red-400 bg-red-400/10';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'info':
        return 'text-blue-400 bg-blue-400/10';
      case 'debug':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.log_level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <Card className="bg-[#1E293B] border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Device Logs</h3>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border-gray-700 text-gray-300 pl-10"
            />
          </div>
          <Tabs value={filterLevel} onValueChange={(v) => setFilterLevel(v as LogLevel)}>
            <TabsList className="bg-[#0F172A] border-gray-700">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="error"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                Errors
              </TabsTrigger>
              <TabsTrigger
                value="warning"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                Warnings
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
              >
                Info
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {searchQuery || filterLevel !== 'all'
              ? 'No logs match your filters'
              : 'No logs available'}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${getLogLevelColor(
                      log.log_level
                    )}`}
                  >
                    {log.log_level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-300">
                        {log.event_type}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{log.message}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-[#0F172A] rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
