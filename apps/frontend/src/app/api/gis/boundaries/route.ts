import { NextResponse } from 'next/server';

export async function GET() {
  const boundaryData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [78.4750, 17.3750],
              [78.4750, 17.3950],
              [78.4950, 17.3950],
              [78.4950, 17.3750],
              [78.4750, 17.3750],
            ],
          ],
        },
        properties: {
          id: 'boundary-001',
          name: 'Village Cluster A',
          type: 'cluster',
          population: 5000,
          area: 2.5,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [78.4950, 17.3750],
              [78.4950, 17.4050],
              [78.5150, 17.4050],
              [78.5150, 17.3750],
              [78.4950, 17.3750],
            ],
          ],
        },
        properties: {
          id: 'boundary-002',
          name: 'Village Cluster B',
          type: 'cluster',
          population: 7500,
          area: 3.2,
        },
      },
    ],
  };

  return NextResponse.json(boundaryData);
}
