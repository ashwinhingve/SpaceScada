import { NextResponse } from 'next/server';

export async function GET() {
  const valveData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4900, 17.3900],
        },
        properties: {
          id: 'square-valve-001',
          name: 'Square Valve SV-001',
          type: 'square',
          status: 'open',
          nodeNumber: 'N-201',
          size: '100mm',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.5100, 17.3900],
        },
        properties: {
          id: 'square-valve-002',
          name: 'Square Valve SV-002',
          type: 'square',
          status: 'partial',
          nodeNumber: 'N-202',
          size: '150mm',
        },
      },
    ],
  };

  return NextResponse.json(valveData);
}
