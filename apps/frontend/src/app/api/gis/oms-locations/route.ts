import { NextResponse } from 'next/server';

/**
 * API Route: OMS Locations
 * Returns GeoJSON data for OMS (Operation & Maintenance Station) locations
 */

export async function GET() {
  // Sample OMS locations data
  // In production, this would fetch from your database
  const omsData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4867, 17.385], // [lng, lat]
        },
        properties: {
          id: 'oms-001',
          name: 'OMS Station 1',
          omsNumber: 'OMS-001',
          status: 'active',
          pressure: 4.5,
          flow: 120.5,
          lastUpdate: new Date().toISOString(),
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4967, 17.395],
        },
        properties: {
          id: 'oms-002',
          name: 'OMS Station 2',
          omsNumber: 'OMS-002',
          status: 'active',
          pressure: 4.2,
          flow: 95.3,
          lastUpdate: new Date().toISOString(),
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.5067, 17.375],
        },
        properties: {
          id: 'oms-003',
          name: 'OMS Station 3',
          omsNumber: 'OMS-003',
          status: 'maintenance',
          pressure: 3.8,
          flow: 0,
          lastUpdate: new Date().toISOString(),
        },
      },
    ],
  };

  return NextResponse.json(omsData);
}
