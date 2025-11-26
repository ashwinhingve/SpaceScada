import { NextResponse } from 'next/server';

export async function GET() {
  const pipelineData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [78.4850, 17.3850],
            [78.4870, 17.3870],
            [78.4890, 17.3880],
          ],
        },
        properties: {
          id: 'pipeline-minor-001',
          name: 'Minor Pipeline 1',
          type: 'minor',
          diameter: 150,
          material: 'PVC',
          length: 0.8,
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [78.4950, 17.3950],
            [78.4970, 17.3960],
            [78.4990, 17.3970],
          ],
        },
        properties: {
          id: 'pipeline-minor-002',
          name: 'Minor Pipeline 2',
          type: 'minor',
          diameter: 100,
          material: 'HDPE',
          length: 0.6,
        },
      },
    ],
  };

  return NextResponse.json(pipelineData);
}
