'use client';

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Search, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

// ============================================================================
// Types
// ============================================================================

export interface FilterTab {
  label: string;
  value: string;
  count?: number;
}

export interface DeviceListProps<T> {
  // Data
  devices: T[];
  loading: boolean;
  error: string | null;

  // Search & Filtering
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  filterTabs?: FilterTab[];
  filterFn?: (device: T, tab: string, searchQuery: string) => boolean;

  // Rendering
  renderCard: (device: T, onDelete?: (id: string) => void) => ReactNode;

  // Actions
  onDelete?: (id: string) => Promise<void>;

  // Create
  createHref?: string;
  createLabel?: string;

  // Empty State
  emptyMessage?: string;
  emptyDescription?: string;
  icon?: LucideIcon;

  // Breadcrumb
  breadcrumb?: { label: string; href?: string }[];

  // Header
  title: string;
  description?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DeviceList<T extends { id: string; name: string }>({
  devices,
  loading,
  error,
  searchQuery = '',
  onSearchChange,
  activeTab = 'all',
  onTabChange,
  filterTabs,
  filterFn,
  renderCard,
  onDelete,
  createHref,
  createLabel = 'Add Device',
  emptyMessage = 'No devices found',
  emptyDescription,
  icon: Icon,
  breadcrumb,
  title,
  description,
}: DeviceListProps<T>) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localActiveTab, setLocalActiveTab] = useState(activeTab);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<{ id: string; name: string } | null>(null);

  // Use controlled or local state
  const currentSearchQuery = onSearchChange ? searchQuery : localSearchQuery;
  const currentActiveTab = onTabChange ? activeTab : localActiveTab;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearchQuery(value);
    }
  };

  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    } else {
      setLocalActiveTab(value);
    }
  };

  const handleDeleteClick = (device: T) => {
    setDeviceToDelete({ id: device.id, name: device.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteForCard = onDelete
    ? (id: string) => {
        const device = devices.find((d) => d.id === id);
        if (device) {
          handleDeleteClick(device);
        }
      }
    : undefined;

  const handleDeleteConfirm = async () => {
    if (!deviceToDelete || !onDelete) return;

    try {
      await onDelete(deviceToDelete.id);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    } catch (err) {
      // Error is handled by the caller
    }
  };

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    if (filterFn) {
      return filterFn(device, currentActiveTab, currentSearchQuery);
    }

    // Default filter: just search by name
    return device.name.toLowerCase().includes(currentSearchQuery.toLowerCase());
  });

  // ========================================================================
  // Loading State
  // ========================================================================

  if (loading) {
    return (
      <div className="max-w-7xl">
        <Card className="bg-[#1E293B] border-gray-800">
          <div className="p-12 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-white mb-2">Loading devices...</h3>
            <p className="text-gray-400">Please wait while we fetch your devices</p>
          </div>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // Error State
  // ========================================================================

  if (error) {
    return (
      <div className="max-w-7xl">
        <Card className="bg-[#1E293B] border-gray-800 border-red-500/50">
          <div className="p-12 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠</div>
            <h3 className="text-xl font-semibold text-white mb-2">Error loading devices</h3>
            <p className="text-gray-400">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // Main Render
  // ========================================================================

  return (
    <div className="max-w-7xl">
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                {item.href ? (
                  <Link href={item.href} className="text-gray-400 hover:text-white">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-white">{item.label}</span>
                )}
                {index < breadcrumb.length - 1 && <span className="text-gray-600">&gt;</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          {description && <p className="text-gray-400">{description}</p>}
        </div>
        {createHref && (
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link href={createHref}>
              <Plus className="h-4 w-4 mr-2" />
              {createLabel}
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      {(filterTabs || onSearchChange) && (
        <Card className="bg-[#1E293B] border-gray-800 mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Tabs */}
              {filterTabs && filterTabs.length > 0 && (
                <Tabs value={currentActiveTab} onValueChange={handleTabChange}>
                  <TabsList className="bg-[#0F172A] border-gray-700">
                    {filterTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="data-[state=active]:bg-gray-700 data-[state=active]:text-white"
                      >
                        {tab.label}
                        {tab.count !== undefined && (
                          <span className="ml-2 text-xs opacity-60">({tab.count})</span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search devices..."
                  value={currentSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-[#0F172A] border-gray-700 text-gray-300 pl-10"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Devices Grid */}
      {filteredDevices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <div key={device.id}>{renderCard(device, handleDeleteForCard)}</div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="bg-[#1E293B] border-gray-800">
          <div className="p-12 text-center">
            {Icon && <Icon className="h-12 w-12 text-gray-600 mx-auto mb-4" />}
            <h3 className="text-xl font-semibold text-white mb-2">{emptyMessage}</h3>
            <p className="text-gray-400 mb-6">
              {currentSearchQuery
                ? 'Try adjusting your search criteria or filter'
                : emptyDescription || 'Get started by adding your first device'}
            </p>
            {!currentSearchQuery && createHref && (
              <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href={createHref}>
                  <Plus className="h-4 w-4 mr-2" />
                  {createLabel}
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {onDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title="Delete device?"
          description={`Are you sure you want to delete "${deviceToDelete?.name}"? This action cannot be undone.`}
          itemName={deviceToDelete?.name}
        />
      )}
    </div>
  );
}
