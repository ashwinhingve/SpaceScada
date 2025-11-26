# WebSCADA Frontend Architecture

## Overview
Clean, scalable, and modular frontend architecture for WebSCADA dashboard supporting multiple device protocols: LoRaWAN, GSM, ESP32 (Wi-Fi), and Bluetooth.

## Design Principles

### 1. Feature-Based Structure
- Organize by features, not technical layers
- Each feature is self-contained
- Easy to locate and modify functionality

### 2. Device Protocol Abstraction
- Unified device interface across all protocols
- Protocol-specific implementations hidden
- Easy to add new device types

### 3. Separation of Concerns
- Clear boundaries between UI, business logic, and data
- Reusable components
- Testable code

### 4. Real-Time First
- WebSocket integration at the core
- Optimistic UI updates
- Efficient data streaming

### 5. Type Safety
- TypeScript throughout
- Shared type definitions
- Runtime validation with Zod

## Directory Structure

```
apps/frontend/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── layout.tsx            # Dashboard shell with sidebar
│   │   ├── page.tsx              # Main dashboard (overview)
│   │   │
│   │   ├── devices/              # Unified device management
│   │   │   ├── page.tsx          # All devices list
│   │   │   ├── [id]/             # Device detail (protocol-agnostic)
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── new/              # Add device wizard
│   │   │   │   └── page.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── analytics/            # Data analytics
│   │   │   ├── page.tsx
│   │   │   └── reports/
│   │   │
│   │   ├── alarms/               # Alarm management
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │
│   │   └── settings/             # User/system settings
│   │       ├── page.tsx
│   │       ├── profile/
│   │       └── api-keys/
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── globals.css
│   └── providers.tsx             # Client providers
│
├── features/                     # Feature modules
│   ├── devices/                  # Device management feature
│   │   ├── components/           # Device-specific components
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── DeviceList.tsx
│   │   │   ├── DeviceDetail.tsx
│   │   │   ├── DeviceMetrics.tsx
│   │   │   ├── DeviceControls.tsx
│   │   │   └── DeviceWizard/
│   │   │       ├── index.tsx
│   │   │       ├── ProtocolSelector.tsx
│   │   │       ├── LoRaWANConfig.tsx
│   │   │       ├── GSMConfig.tsx
│   │   │       ├── ESP32Config.tsx
│   │   │       └── BluetoothConfig.tsx
│   │   │
│   │   ├── hooks/                # Device-related hooks
│   │   │   ├── useDevices.ts
│   │   │   ├── useDevice.ts
│   │   │   ├── useDeviceMetrics.ts
│   │   │   ├── useDeviceControl.ts
│   │   │   └── useDeviceWebSocket.ts
│   │   │
│   │   ├── services/             # Device API services
│   │   │   ├── deviceApi.ts
│   │   │   ├── deviceWebSocket.ts
│   │   │   └── deviceProtocols/
│   │   │       ├── lorawan.ts
│   │   │       ├── gsm.ts
│   │   │       ├── esp32.ts
│   │   │       └── bluetooth.ts
│   │   │
│   │   ├── types/                # Device-specific types
│   │   │   ├── device.types.ts
│   │   │   ├── lorawan.types.ts
│   │   │   ├── gsm.types.ts
│   │   │   ├── esp32.types.ts
│   │   │   └── bluetooth.types.ts
│   │   │
│   │   └── utils/                # Device utilities
│   │       ├── deviceMappers.ts
│   │       ├── deviceValidators.ts
│   │       └── protocolHelpers.ts
│   │
│   ├── dashboard/                # Dashboard feature
│   │   ├── components/
│   │   │   ├── DashboardGrid.tsx
│   │   │   ├── WidgetContainer.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── widgets/
│   │   │       ├── DeviceStatusWidget.tsx
│   │   │       ├── MetricsWidget.tsx
│   │   │       ├── AlertsWidget.tsx
│   │   │       └── MapWidget.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDashboardData.ts
│   │   │   └── useWidgetLayout.ts
│   │   │
│   │   └── services/
│   │       └── dashboardApi.ts
│   │
│   ├── analytics/                # Analytics feature
│   │   ├── components/
│   │   │   ├── ReportBuilder.tsx
│   │   │   ├── DataExporter.tsx
│   │   │   └── charts/
│   │   │       ├── TimeSeriesChart.tsx
│   │   │       ├── ComparisonChart.tsx
│   │   │       └── DistributionChart.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAnalytics.ts
│   │   │   └── useReports.ts
│   │   │
│   │   └── services/
│   │       └── analyticsApi.ts
│   │
│   ├── alarms/                   # Alarm management
│   │   ├── components/
│   │   │   ├── AlarmList.tsx
│   │   │   ├── AlarmDetail.tsx
│   │   │   ├── AlarmConfig.tsx
│   │   │   └── AlarmNotifications.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAlarms.ts
│   │   │   └── useAlarmActions.ts
│   │   │
│   │   └── services/
│   │       └── alarmApi.ts
│   │
│   └── auth/                     # Authentication
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   └── RegisterForm.tsx
│       │
│       ├── hooks/
│       │   └── useAuth.ts
│       │
│       └── services/
│           └── authApi.ts
│
├── components/                   # Shared/reusable components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── AppSidebar.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AppFooter.tsx
│   │   ├── PageHeader.tsx
│   │   └── PageContainer.tsx
│   │
│   ├── charts/                   # Reusable chart components
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── GaugeChart.tsx
│   │   └── RealtimeChart.tsx
│   │
│   ├── data-display/             # Data display components
│   │   ├── DataTable.tsx
│   │   ├── MetricCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── EmptyState.tsx
│   │
│   └── feedback/                 # Feedback components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── Toast.tsx
│       └── ConfirmDialog.tsx
│
├── lib/                          # Core utilities and configurations
│   ├── api/                      # API client
│   │   ├── client.ts             # Axios/Fetch configuration
│   │   ├── endpoints.ts          # API endpoints
│   │   └── interceptors.ts       # Request/response interceptors
│   │
│   ├── websocket/                # WebSocket client
│   │   ├── client.ts
│   │   ├── events.ts
│   │   └── handlers.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── dateUtils.ts
│   │   └── deviceUtils.ts
│   │
│   └── constants/                # App constants
│       ├── routes.ts
│       ├── deviceTypes.ts
│       └── colors.ts
│
├── hooks/                        # Global hooks
│   ├── useWebSocket.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── useDebounce.ts
│
├── store/                        # State management (Zustand)
│   ├── index.ts
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── devicesSlice.ts
│   │   ├── alarmsSlice.ts
│   │   └── uiSlice.ts
│   │
│   └── middleware/
│       ├── persist.ts
│       └── logger.ts
│
├── types/                        # Global TypeScript types
│   ├── index.ts
│   ├── api.types.ts
│   ├── common.types.ts
│   └── websocket.types.ts
│
└── styles/                       # Global styles
    ├── globals.css
    └── themes/
        ├── light.css
        └── dark.css
```

## Key Architectural Patterns

### 1. Device Protocol Abstraction

All device protocols implement a common interface:

```typescript
interface Device {
  id: string;
  name: string;
  protocol: DeviceProtocol;
  status: DeviceStatus;
  lastSeen: Date;
  metrics: DeviceMetrics;
  config: ProtocolConfig; // Protocol-specific
}

type DeviceProtocol = 'lorawan' | 'gsm' | 'esp32' | 'bluetooth';

// Protocol-specific configs extend base
interface LoRaWANConfig extends BaseConfig {
  devEUI: string;
  appEUI: string;
  appKey: string;
  // ...
}
```

### 2. Feature Module Pattern

Each feature is self-contained with:
- **Components**: UI components for the feature
- **Hooks**: React hooks for data fetching and state
- **Services**: API calls and business logic
- **Types**: TypeScript definitions
- **Utils**: Helper functions

### 3. Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (Pages, Components, Hooks)         │
├─────────────────────────────────────┤
│        Business Logic Layer         │
│     (Services, State Management)    │
├─────────────────────────────────────┤
│         Data Access Layer           │
│    (API Client, WebSocket Client)   │
├─────────────────────────────────────┤
│         External Services           │
│      (Backend API, WebSocket)       │
└─────────────────────────────────────┘
```

### 4. Real-Time Data Flow

```
Backend WebSocket
       ↓
WebSocket Client (lib/websocket)
       ↓
Device Service (features/devices/services)
       ↓
Zustand Store (store/slices/devicesSlice)
       ↓
React Hook (features/devices/hooks/useDevices)
       ↓
Component (features/devices/components/DeviceList)
```

### 5. Component Hierarchy

```
App
└── DashboardLayout
    ├── AppHeader
    ├── AppSidebar
    └── PageContainer
        ├── PageHeader
        └── Feature Components
            ├── DeviceList
            │   └── DeviceCard (x N)
            │       ├── DeviceMetrics
            │       └── DeviceControls
            └── DashboardWidgets
                ├── DeviceStatusWidget
                ├── MetricsWidget
                └── AlertsWidget
```

## Data Flow Patterns

### 1. Device List Flow

```typescript
// 1. Component mounts
const DeviceListPage = () => {
  // 2. Custom hook fetches data
  const { devices, loading, error } = useDevices();

  // 3. WebSocket updates handled automatically
  useDeviceWebSocket({
    onUpdate: (device) => updateDeviceInStore(device),
  });

  // 4. Render with data
  return <DeviceList devices={devices} />;
};
```

### 2. Device Control Flow

```typescript
// 1. User clicks control button
const handleControl = async (deviceId: string, action: ControlAction) => {
  // 2. Optimistic update
  updateDeviceOptimistically(deviceId, action);

  // 3. Send command to backend
  try {
    await deviceApi.sendControl(deviceId, action);
  } catch (error) {
    // 4. Rollback on error
    rollbackDeviceUpdate(deviceId);
    showError(error);
  }
};
```

## State Management Strategy

### Global State (Zustand)
- **Auth**: User session, permissions
- **Devices**: All connected devices
- **Alarms**: Active alarms
- **UI**: Theme, sidebar state, notifications

### Local State (React)
- Form inputs
- Modal visibility
- Temporary UI state
- Component-specific data

### Server State (React Query - Optional)
- Cache API responses
- Background refetching
- Optimistic updates
- Request deduplication

## API Integration

### RESTful Endpoints
```typescript
// features/devices/services/deviceApi.ts
export const deviceApi = {
  getAll: () => api.get<Device[]>('/devices'),
  getById: (id: string) => api.get<Device>(`/devices/${id}`),
  create: (data: CreateDeviceDto) => api.post<Device>('/devices', data),
  update: (id: string, data: UpdateDeviceDto) => api.patch<Device>(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
  control: (id: string, action: ControlAction) => api.post(`/devices/${id}/control`, action),
};
```

### WebSocket Events
```typescript
// lib/websocket/events.ts
export enum DeviceEvent {
  STATUS_UPDATE = 'device:status:update',
  METRICS_UPDATE = 'device:metrics:update',
  CONNECTED = 'device:connected',
  DISCONNECTED = 'device:disconnected',
  ALARM_TRIGGERED = 'device:alarm:triggered',
}
```

## Testing Strategy

### Unit Tests
- Utility functions
- Custom hooks
- Service functions

### Integration Tests
- API client
- WebSocket client
- State management

### Component Tests
- UI components
- User interactions
- Data rendering

### E2E Tests
- Critical user flows
- Device management
- Real-time updates

## Performance Optimizations

### 1. Code Splitting
```typescript
// Lazy load feature modules
const DevicesPage = lazy(() => import('@/features/devices/components/DeviceList'));
const AnalyticsPage = lazy(() => import('@/features/analytics'));
```

### 2. Memoization
```typescript
// Expensive computations
const sortedDevices = useMemo(
  () => devices.sort((a, b) => a.name.localeCompare(b.name)),
  [devices]
);

// Prevent re-renders
const DeviceCard = memo(({ device }) => {
  // ...
});
```

### 3. Virtual Scrolling
```typescript
// For large device lists
import { useVirtualizer } from '@tanstack/react-virtual';
```

### 4. WebSocket Throttling
```typescript
// Limit update frequency
const throttledUpdate = useThrottle(updateMetrics, 1000);
```

## Security Considerations

### 1. Authentication
- JWT tokens in HTTP-only cookies
- Auto-refresh before expiration
- Secure storage of sensitive data

### 2. Authorization
- Role-based access control
- Route protection
- Component-level permissions

### 3. Data Validation
- Zod schemas for all inputs
- Runtime type checking
- Sanitize user inputs

### 4. WebSocket Security
- Token-based authentication
- Event validation
- Rate limiting

## Migration Guide

### From Old Structure
1. Move device-specific pages to unified `/devices` route
2. Extract device components to feature modules
3. Consolidate device types into protocol abstraction
4. Migrate hooks to feature-specific hooks
5. Update imports throughout the app

### Backward Compatibility
- Keep old routes with redirects
- Gradually migrate components
- Maintain API contracts
- Document breaking changes

## Developer Guidelines

### 1. File Naming
- Components: PascalCase (DeviceCard.tsx)
- Hooks: camelCase with 'use' prefix (useDevices.ts)
- Utils: camelCase (formatters.ts)
- Types: PascalCase with .types suffix (device.types.ts)

### 2. Import Organization
```typescript
// 1. External imports
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 2. Internal imports (absolute paths)
import { Device } from '@/types';
import { deviceApi } from '@/features/devices/services';

// 3. Relative imports
import { DeviceCard } from './DeviceCard';
```

### 3. Component Structure
```typescript
// 1. Types
interface Props {
  device: Device;
  onSelect?: (id: string) => void;
}

// 2. Component
export function DeviceCard({ device, onSelect }: Props) {
  // 3. Hooks
  const [isExpanded, setIsExpanded] = useState(false);

  // 4. Derived state
  const statusColor = getStatusColor(device.status);

  // 5. Handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
    onSelect?.(device.id);
  };

  // 6. Render
  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
}
```

## Next Steps

1. ✅ Remove old structure
2. ✅ Create new directory structure
3. ✅ Implement device abstraction layer
4. ✅ Migrate existing components
5. ✅ Update routing
6. ✅ Implement WebSocket integration
7. ✅ Add tests
8. ✅ Update documentation

---

**Status**: Ready for Implementation
**Last Updated**: 2025-11-20
**Version**: 2.0.0
