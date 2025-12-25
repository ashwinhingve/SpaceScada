'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { MapPin, ArrowRight } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { GISDashboard } from '@/components/gis/GISDashboard';
import { WidgetToolbar } from '@/components/dashboard/WidgetToolbar';
import { WidgetRenderer } from '@/components/dashboard/WidgetRenderer';
import { useWidgetStore } from '@/stores/widgetStore';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function ConsoleDashboard() {
  const { widgets, loading, fetchWidgets, updateLayout, removeWidget } = useWidgetStore();

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  // Convert widgets to react-grid-layout format
  const layouts = useMemo(() => {
    const gridLayouts: Layout[] = widgets.map((widget) => ({
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: widget.layout.w,
      h: widget.layout.h,
      minW: widget.layout.minW,
      minH: widget.layout.minH,
      maxW: widget.layout.maxW,
      maxH: widget.layout.maxH,
    }));

    return {
      lg: gridLayouts,
      md: gridLayouts,
      sm: gridLayouts,
      xs: gridLayouts,
    };
  }, [widgets]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    // Only update if layouts actually changed
    const updates = newLayout
      .filter((layout) => {
        const widget = widgets.find((w) => w.id === layout.i);
        return (
          widget &&
          (widget.layout.x !== layout.x ||
            widget.layout.y !== layout.y ||
            widget.layout.w !== layout.w ||
            widget.layout.h !== layout.h)
        );
      })
      .map((layout) => ({
        widgetId: layout.i,
        layout: {
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
        },
      }));

    if (updates.length > 0) {
      updateLayout(updates);
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    if (confirm('Are you sure you want to remove this widget?')) {
      await removeWidget(widgetId);
    }
  };

  return (
    <div className="max-w-full">
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/console" className="text-gray-400 hover:text-white">
            Home
          </Link>
          <span className="text-gray-600">&gt;</span>
          <span className="text-white">Dashboard</span>
        </div>
      </div>

      {/* Compact Map at Top */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Network Map</h2>
          </div>
          <Link
            href="/console/gis"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
          >
            Full Screen View
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
          <GISDashboard
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            className="h-[400px]"
          />
        ) : (
          <div className="h-[400px] bg-[#1E293B] border border-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg mb-2">Map View Unavailable</p>
              <p className="text-sm">
                Google Maps API key not configured.
                <br />
                Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Widget Toolbar */}
      <WidgetToolbar />

      {/* Widget Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading widgets...</div>
        </div>
      ) : widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-[#1E293B] border border-gray-800 rounded-lg">
          <div className="text-gray-400 text-center">
            <p className="text-lg mb-2">No widgets added yet</p>
            <p className="text-sm">Use the toolbar above to add widgets to your dashboard</p>
          </div>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={60}
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          preventCollision={false}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".cursor-move"
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="widget-item">
              <WidgetRenderer widget={widget} onRemove={handleRemoveWidget} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }

        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.2);
          opacity: 0.5;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 0.5rem;
        }

        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .react-grid-item > .react-resizable-handle::after {
          content: '';
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid rgba(156, 163, 175, 0.6);
          border-bottom: 2px solid rgba(156, 163, 175, 0.6);
        }

        .react-grid-item:hover > .react-resizable-handle::after {
          border-color: rgba(59, 130, 246, 0.8);
        }

        .widget-item {
          overflow: hidden;
        }
      `,
        }}
      />
    </div>
  );
}
