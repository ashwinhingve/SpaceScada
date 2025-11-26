# WebSCADA GIS Module - Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Google Cloud account with billing enabled
- Basic understanding of React and Next.js

## Step 1: Install Required Package

Add the Google Maps JavaScript API Loader package:

```bash
cd apps/frontend
pnpm add @googlemaps/js-api-loader
```

## Step 2: Get Google Maps API Key

### Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "WebSCADA GIS")
4. Click "Create"

### Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geometry API**

### Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. Click "Restrict Key" (recommended)
5. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain (e.g., `localhost:3000/*`, `yourdomain.com/*`)
6. Under "API restrictions":
   - Select "Restrict key"
   - Choose the three APIs you enabled above
7. Click "Save"

### Enable Billing

Google Maps requires billing to be enabled:
1. Go to "Billing" in Google Cloud Console
2. Link a billing account or create a new one
3. Note: Google provides $200 free credit per month

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cd apps/frontend
cp .env.example .env.local
```

2. Edit `.env.local` and add your Google Maps API key:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_ENABLE_GIS=true
```

## Step 4: Add Custom Marker Icons

Create marker icon files in `apps/frontend/public/gis/icons/`:

### Option A: Use Simple SVG Markers

Create these files with basic colored circles:

**oms-marker.png** (Blue circle, 32x32px)
**air-valve.png** (Orange circle, 24x24px)
**square-valve.png** (Red square, 24x24px)
**sluice-valve.png** (Purple diamond, 24x24px)
**node-marker.png** (Black dot, 20x20px)

### Option B: Use Custom Icons

Place your custom PNG icon files (with transparency) in the icons directory.

### Quick SVG Icon Generator Script

Create a script to generate basic icons:

```bash
#!/bin/bash
mkdir -p apps/frontend/public/gis/icons

# Create basic colored circles as placeholders
echo '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <circle cx="16" cy="16" r="12" fill="#2196F3" stroke="#fff" stroke-width="2"/>
</svg>' > apps/frontend/public/gis/icons/oms-marker.svg

# Convert SVG to PNG if needed (requires imagemagick)
# convert oms-marker.svg oms-marker.png
```

## Step 5: Verify Installation

1. Start the development server:
```bash
cd apps/frontend
pnpm dev
```

2. Navigate to `http://localhost:3000/console/dashboard`

3. Scroll down to see the "Network Map View" section

4. Verify:
   - [ ] Map loads without errors
   - [ ] Layer controls appear on the right
   - [ ] Sample data points are visible
   - [ ] Clicking markers shows info windows
   - [ ] Layer toggle buttons work

## Step 6: Customize for Your Data

### Update Map Center

Edit `apps/frontend/src/lib/gis/layerConfig.ts`:

```typescript
export const DEFAULT_MAP_CONFIG = {
  center: { lat: YOUR_LATITUDE, lng: YOUR_LONGITUDE },
  zoom: 13, // Adjust zoom level
};
```

### Connect to Your Database

Replace sample data in API routes (e.g., `apps/frontend/src/app/api/gis/oms-locations/route.ts`):

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Your database connection

export async function GET() {
  // Fetch real data from your database
  const omsLocations = await db.query(`
    SELECT
      id,
      name,
      oms_number,
      latitude,
      longitude,
      status,
      pressure,
      flow,
      updated_at as last_update
    FROM oms_stations
    WHERE active = true
  `);

  // Convert to GeoJSON format
  const geoJSON = {
    type: 'FeatureCollection',
    features: omsLocations.map(oms => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [oms.longitude, oms.latitude],
      },
      properties: {
        id: oms.id,
        name: oms.name,
        omsNumber: oms.oms_number,
        status: oms.status,
        pressure: oms.pressure,
        flow: oms.flow,
        lastUpdate: oms.last_update,
      },
    })),
  };

  return NextResponse.json(geoJSON);
}
```

## Step 7: Add Your KML/GeoJSON Data

### Option A: Use Existing GeoJSON Files

1. Place your GeoJSON files in `apps/frontend/public/gis/data/`
2. Update API routes to serve static files:

```typescript
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const filePath = join(process.cwd(), 'public', 'gis', 'data', 'pipelines.geojson');
  const geoJSON = JSON.parse(readFileSync(filePath, 'utf-8'));
  return NextResponse.json(geoJSON);
}
```

### Option B: Convert KML to GeoJSON

Use online tools or libraries:
- **Online**: https://mygeodata.cloud/converter/kml-to-geojson
- **Command Line**: `ogr2ogr -f GeoJSON output.geojson input.kml`

## Troubleshooting

### Map Shows "For development purposes only" Watermark

**Cause**: Billing not enabled on Google Cloud project
**Solution**: Enable billing in Google Cloud Console

### "Google Maps JavaScript API error: ApiTargetBlockedMapError"

**Cause**: API key restrictions too strict
**Solution**: Check and update HTTP referrer restrictions

### Layers Not Appearing

**Cause**: API endpoints returning errors
**Solution**:
1. Open browser DevTools → Network tab
2. Check `/api/gis/*` requests for errors
3. Verify GeoJSON format is correct

### "Cannot find module '@googlemaps/js-api-loader'"

**Cause**: Package not installed
**Solution**: Run `pnpm add @googlemaps/js-api-loader`

## Testing Checklist

- [ ] Map loads successfully
- [ ] All 8 layers can be toggled on/off
- [ ] Markers display custom icons
- [ ] Clicking markers shows information
- [ ] Pipelines render as lines
- [ ] Boundaries render as shaded polygons
- [ ] Legend updates when layers change
- [ ] Full-screen view works (`/console/gis`)
- [ ] Map types can be changed (Satellite, Hybrid, etc.)
- [ ] Performance is acceptable with your data volume

## Next Steps

1. **Import Real Data**: Replace sample data with actual infrastructure data
2. **Customize Styles**: Update colors and icons in `layerConfig.ts`
3. **Add Real-Time Updates**: Integrate WebSocket for live data
4. **Add Custom Controls**: Implement measurement tools, drawing tools, etc.
5. **Optimize Performance**: Implement clustering for dense marker data
6. **Add Monitoring**: Set up Google Maps API usage monitoring

## Support Resources

- **Google Maps Documentation**: https://developers.google.com/maps/documentation/javascript
- **GeoJSON Specification**: https://geojson.org/
- **WebSCADA GIS README**: See `GIS-MODULE-README.md`
- **Google Maps Pricing**: https://mapsplatform.google.com/pricing/

## Cost Estimation

Google Maps pricing (as of 2024):
- Maps JavaScript API: $7 per 1,000 loads
- First $200 per month is free
- Most WebSCADA deployments stay within free tier

Monitor usage in Google Cloud Console → "APIs & Services" → "Dashboard"

---

**Setup Time**: 15-30 minutes
**Difficulty**: Intermediate
**Version**: 1.0.0
