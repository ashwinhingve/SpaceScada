# WebSCADA Dashboard

A real-time monitoring dashboard built with Next.js 14, TypeScript, and Shadcn/ui for the WebSCADA system.

## Features

### Real-time Data Visualization

- **Live Updates**: WebSocket connection with auto-reconnection and exponential backoff
- **Data Cards**: Display single metrics with sparkline trends
- **Trend Charts**: Multi-line charts with Recharts for historical data
- **Circular Gauges**: Visual representation of percentage metrics with thresholds
- **Device Status**: Real-time online/offline status monitoring

### State Management

- **Zustand Store**: Lightweight, performant global state management
- **Circular Buffer**: Maintains last 100 data points per tag in memory
- **Efficient Updates**: Map-based device storage for O(1) lookups

### Layout & Navigation

- **Responsive Design**: Mobile-first approach with adaptive sidebar
- **Header**: Connection status, notifications, user menu
- **Sidebar**: Device list with search and status filtering
- **Main Area**: Dashboard with overview, device details, and charts

### Performance Optimizations

- **React.memo**: Memoized components to prevent unnecessary re-renders
- **useMemo**: Calculated values cached for efficiency
- **Lazy Loading**: Charts and heavy components loaded on demand
- **Debouncing**: Search and filter operations optimized

### Error Handling

- **Error Boundaries**: Graceful component failure handling
- **Connection Recovery**: Auto-reconnection with exponential backoff
- **Loading States**: Clear feedback during data fetching
- **Empty States**: Helpful messages when no data available

## Project Structure

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Main dashboard page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── ConnectionIndicator.tsx
│   │   │   ├── DataCard.tsx
│   │   │   ├── DeviceStatus.tsx
│   │   │   ├── MetricGauge.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── loading.tsx
│   │   │   └── index.ts
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts         # WebSocket connection hook
│   ├── store/
│   │   └── dashboard-store.ts      # Zustand state management
│   ├── types/
│   │   └── dashboard.ts            # TypeScript definitions
│   ├── lib/
│   │   ├── utils.ts                # Utility functions (cn)
│   │   └── format.ts               # Formatting utilities
│   └── .env.example                # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── DASHBOARD.md                    # This file
```

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3002
```

### 3. Start Development Server

```bash
# From project root
pnpm --filter @webscada/frontend dev

# Or from frontend directory
cd apps/frontend
pnpm dev
```

The dashboard will be available at `http://localhost:3000/dashboard`.

## Components

### Dashboard Components

#### ConnectionIndicator

Displays WebSocket connection status with visual indicators.

```tsx
import { ConnectionIndicator } from '@/components/dashboard';

<ConnectionIndicator showLabel={true} />;
```

**States:**

- `CONNECTED`: Green indicator with pulse animation
- `CONNECTING`: Yellow with spinner and reconnect count
- `DISCONNECTED`: Gray indicator
- `ERROR`: Red indicator with alert icon

#### DataCard

Displays a single metric with value, trend, and inline sparkline.

```tsx
import { DataCard } from '@/components/dashboard';

<DataCard tag={deviceTag} history={tagHistory} />;
```

**Features:**

- Real-time value display
- Quality indicator (GOOD/BAD/UNCERTAIN)
- Percentage change from first reading
- Inline sparkline with color-coded trends
- Last update timestamp

#### DeviceStatus

Shows device information and status with two variants.

```tsx
import { DeviceStatus } from '@/components/dashboard';

<DeviceStatus device={device} variant="compact" />
<DeviceStatus device={device} variant="detailed" />
```

**Variants:**

- `compact`: Minimal icon and label
- `detailed`: Full device info with tags

#### TrendChart

Multi-line chart for visualizing historical data.

```tsx
import { TrendChart } from '@/components/dashboard';

<TrendChart
  title="Temperature Trends"
  description="Last 100 readings"
  tags={deviceTags}
  history={tagHistory}
  height={400}
  showLegend={true}
  showGrid={true}
/>;
```

**Features:**

- Multiple tags on same chart
- Custom tooltips with quality indicators
- Responsive container
- Legend with tag names and units
- Time-based X-axis

#### MetricGauge

Circular gauge for percentage-based metrics.

```tsx
import { MetricGauge } from '@/components/dashboard';

<MetricGauge
  title="Device Availability"
  value={75}
  max={100}
  unit="%"
  size="md"
  thresholds={{ warning: 80, danger: 60 }}
/>;
```

**Features:**

- Three sizes: sm, md, lg
- Color-coded based on thresholds
- Status labels (Normal/Warning/Critical)
- Threshold indicators

### Layout Components

#### Header

Main navigation header with connection status.

```tsx
import { Header } from '@/components/layout';

<Header onMenuClick={() => setOpen(!open)} />;
```

**Features:**

- Logo and branding
- Connection indicator
- Notifications badge
- User menu
- Mobile menu toggle

#### Sidebar

Device list with search and filtering.

```tsx
import { Sidebar } from '@/components/layout';

<Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />;
```

**Features:**

- Device search
- Status filtering (All/Online/Offline/Error)
- Device selection
- Status counts footer
- Mobile overlay

### UI Components

#### Badge

Status and category badges.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="default">Online</Badge>
<Badge variant="destructive">Error</Badge>
```

#### Card

Container for grouped content.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>;
```

#### Loading

Loading indicators for async operations.

```tsx
import { Loading, LoadingOverlay, LoadingInline } from '@/components/ui';

<Loading size="md" text="Loading..." />
<LoadingOverlay text="Processing..." />
<LoadingInline text="Fetching data..." />
```

## Hooks

### useWebSocket

Custom hook for WebSocket connection management.

```tsx
import { useWebSocket } from '@/hooks/useWebSocket';

const { connect, disconnect, subscribe, unsubscribe, isConnected } = useWebSocket({
  url: 'http://localhost:3002',
  autoConnect: true,
  maxReconnectAttempts: 10,
});

// Subscribe to devices
useEffect(() => {
  subscribe(['device-1', 'device-2']);
  return () => unsubscribe(['device-1', 'device-2']);
}, []);
```

**Features:**

- Auto-reconnection with exponential backoff
- Heartbeat mechanism (30s interval)
- Event handlers for data updates
- Automatic state updates via Zustand store

## State Management

### Dashboard Store

Zustand store for global dashboard state.

```tsx
import { useDashboardStore } from '@/store/dashboard-store';

const {
  connectionStatus,
  devices,
  selectedDeviceId,
  tagHistory,
  setConnectionStatus,
  updateDeviceTags,
  updateDeviceStatus,
  setSelectedDevice,
} = useDashboardStore();
```

**State:**

- `connectionStatus`: WebSocket connection state
- `reconnectAttempts`: Number of reconnection attempts
- `devices`: Map of device ID to DeviceData
- `selectedDeviceId`: Currently selected device
- `tagHistory`: Map of tag ID to DataPoint array (max 100)

**Actions:**

- `setConnectionStatus(status)`: Update connection status
- `incrementReconnectAttempts()`: Increment reconnect counter
- `resetReconnectAttempts()`: Reset reconnect counter
- `setDevices(devices)`: Initialize devices
- `updateDevice(device)`: Update single device
- `updateDeviceTags(deviceId, tags)`: Update device tags and history
- `updateDeviceStatus(deviceId, status)`: Update device status
- `setSelectedDevice(deviceId)`: Set selected device
- `addDataPoint(tagId, dataPoint)`: Add data point to history
- `getTagHistory(tagId)`: Get tag history

## Types

### ConnectionStatus

```typescript
enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}
```

### DeviceData

```typescript
interface DeviceData {
  id: string;
  name: string;
  type: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  location?: string;
  tags: DeviceTag[];
  lastUpdate: string;
}
```

### DeviceTag

```typescript
interface DeviceTag {
  id: string;
  deviceId: string;
  name: string;
  dataType: 'FLOAT' | 'INTEGER' | 'BOOLEAN' | 'STRING';
  unit?: string;
  value: number | boolean | string | null;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
  timestamp: string;
}
```

### DataPoint

```typescript
interface DataPoint {
  timestamp: string;
  value: number | boolean | string | null;
  quality: 'GOOD' | 'BAD' | 'UNCERTAIN';
}
```

## Utilities

### Format Functions

```typescript
import {
  formatRelativeTime,
  formatNumber,
  formatBytes,
  formatDuration,
  formatPercentage,
  movingAverage,
  standardDeviation,
} from '@/lib/format';

formatRelativeTime(new Date()); // "5m ago"
formatNumber(123.456, 2); // "123.46"
formatBytes(1024); // "1 KB"
formatDuration(65000); // "1m 5s"
formatPercentage(75, 100); // "75.0%"
```

### Class Name Utility

```typescript
import { cn } from '@/lib/utils';

<div className={cn('base-class', isActive && 'active-class')} />
```

## Error Handling

### ErrorBoundary

Wrap components to catch and handle errors gracefully.

```tsx
import { ErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary';

// Component wrapper
<ErrorBoundary fallback={<div>Error occurred</div>}>
  <YourComponent />
</ErrorBoundary>;

// HOC pattern
const SafeComponent = withErrorBoundary(YourComponent);
```

## Performance Tips

### 1. Memoize Expensive Calculations

```tsx
const filteredData = useMemo(() => {
  return data.filter((item) => item.status === 'ONLINE');
}, [data]);
```

### 2. Debounce Search Input

```tsx
import { debounce } from '@/lib/format';

const handleSearch = useMemo(
  () =>
    debounce((query: string) => {
      // Perform search
    }, 300),
  []
);
```

### 3. Virtual Scrolling for Large Lists

Consider using `react-window` or `react-virtual` for long device lists.

### 4. Lazy Load Charts

```tsx
import dynamic from 'next/dynamic';

const TrendChart = dynamic(() => import('@/components/dashboard/TrendChart'), {
  ssr: false,
  loading: () => <Loading />,
});
```

## Styling

### Tailwind CSS

The dashboard uses Tailwind CSS with custom theme configuration.

**Color Scheme:**

- Primary: Blue
- Success: Green
- Warning: Orange/Yellow
- Danger: Red
- Muted: Gray

### Dark Mode

The dashboard supports dark mode through Tailwind's dark mode feature.

## Testing

### Component Testing

```bash
# Run tests (when implemented)
pnpm test
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Deployment

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Docker

```bash
docker build -t webscada-frontend -f apps/frontend/Dockerfile .
docker run -p 3000:3000 webscada-frontend
```

## Troubleshooting

### WebSocket Connection Issues

1. Check that realtime-service is running on port 3002
2. Verify CORS settings in realtime-service
3. Check browser console for connection errors
4. Ensure `.env.local` has correct WebSocket URL

### No Data Displayed

1. Verify devices exist in realtime-service
2. Check WebSocket subscription in browser DevTools
3. Ensure device IDs match between frontend and backend
4. Check console for API errors

### Performance Issues

1. Reduce `DATA_HISTORY_SIZE` in store (default: 100)
2. Limit number of visible tags on charts
3. Implement virtual scrolling for device list
4. Use React DevTools Profiler to identify bottlenecks

## Contributing

When adding new components:

1. Create component in appropriate directory
2. Add TypeScript types
3. Export from index file
4. Add to this documentation
5. Follow existing patterns and naming conventions

## License

Part of the WebSCADA project. See main repository for license information.
