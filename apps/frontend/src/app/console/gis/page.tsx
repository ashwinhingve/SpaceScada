'use client';

/**
 * Full-Screen GIS Page
 * Dedicated page for GIS map visualization with all layers
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GISDashboard } from '@/components/gis/GISDashboard';

export default function GISPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Breadcrumb */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/console/dashboard"
            className="text-gray-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <span className="text-gray-600">&gt;</span>
          <span className="text-white">GIS Map View</span>
        </div>
      </div>

      {/* Full Screen GIS Dashboard */}
      <GISDashboard
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        className="h-full"
      />
    </div>
  );
}
