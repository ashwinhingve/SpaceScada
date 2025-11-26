import { NextResponse } from 'next/server';

export async function GET() {
  const nodeData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4850, 17.3850],
        },
        properties: {
          id: 'node-001',
          nodeNumber: 'N-101',
          omsNumber: 'OMS-001',
          label: 'N-101',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.4950, 17.3950],
        },
        properties: {
          id: 'node-002',
          nodeNumber: 'N-102',
          omsNumber: 'OMS-001',
          label: 'N-102',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [78.5050, 17.3950],
        },
        properties: {
          id: 'node-003',
          nodeNumber: 'N-103',
          omsNumber: 'OMS-002',
          label: 'N-103',
        },
      },
    ],
  };

  return NextResponse.json(nodeData);
}
