import { NextResponse } from 'next/server';

/**
 * API Route: Air Valves
 * Returns GeoJSON data for air release valve locations
 */

export async function GET() {
  const valveData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4850, 17.3850],
        },
        properties: {
          id: 'air-valve-001',
          name: 'Air Valve AV-001',
          type: 'air',
          status: 'open',
          nodeNumber: 'N-101',
          size: '50mm',
          installDate: '2023-01-15',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4950, 17.3950],
        },
        properties: {
          id: 'air-valve-002',
          name: 'Air Valve AV-002',
          type: 'air',
          status: 'open',
          nodeNumber: 'N-102',
          size: '50mm',
          installDate: '2023-02-20',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.5050, 17.3950],
        },
        properties: {
          id: 'air-valve-003',
          name: 'Air Valve AV-003',
          type: 'air',
          status: 'closed',
          nodeNumber: 'N-103',
          size: '75mm',
          installDate: '2023-03-10',
        },
      },
    ],
  };

  return NextResponse.json(valveData);
}
