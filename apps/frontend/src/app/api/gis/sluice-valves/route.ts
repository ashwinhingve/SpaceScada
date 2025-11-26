import { NextResponse } from 'next/server';

export async function GET() {
  const valveData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4820, 17.3820],
        },
        properties: {
          id: 'sluice-valve-001',
          name: 'Sluice Valve SLV-001',
          type: 'sluice',
          status: 'open',
          nodeNumber: 'N-301',
          size: '200mm',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.5020, 17.4020],
        },
        properties: {
          id: 'sluice-valve-002',
          name: 'Sluice Valve SLV-002',
          type: 'sluice',
          status: 'closed',
          nodeNumber: 'N-302',
          size: '250mm',
        },
      },
    ],
  };

  return NextResponse.json(valveData);
}
