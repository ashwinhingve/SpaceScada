import { NextResponse } from 'next/server';

/**
 * API Route: Main Pipeline
 * Returns GeoJSON data for main water distribution pipelines
 */

export async function GET() {
  const pipelineData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [78.4800, 17.3800],
            [78.4850, 17.3850],
            [78.4900, 17.3900],
            [78.4950, 17.3950],
            [78.5000, 17.4000],
          ],
        },
        properties: {
          id: 'pipeline-main-001',
          name: 'Main Pipeline 1',
          type: 'main',
          diameter: 600,
          material: 'DI (Ductile Iron)',
          pressure: 4.5,
          length: 5.2,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [78.5000, 17.4000],
            [78.5050, 17.3950],
            [78.5100, 17.3900],
            [78.5150, 17.3850],
          ],
        },
        properties: {
          id: 'pipeline-main-002',
          name: 'Main Pipeline 2',
          type: 'main',
          diameter: 450,
          material: 'DI (Ductile Iron)',
          pressure: 4.2,
          length: 3.8,
        },
      },
    ],
  };

  return NextResponse.json(pipelineData);
}
