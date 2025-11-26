# Frontend Architecture - WebSCADA

## Overview
This document outlines the frontend architecture following Next.js 14 App Router best practices with a focus on scalability, maintainability, and developer experience.

## Directory Structure

```
apps/frontend/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   │
│   └── console/                 # Console application (protected routes)
│       ├── layout.tsx           # Console layout with navigation
│       ├── page.tsx             # Console home dashboard
│       │
│       ├── dashboard/           # Main analytics dashboard
│       │   └── page.tsx
│       │
│       ├── lorawan/             # LoRaWAN Devices
│       │   ├── page.tsx         # Device list
│       │   ├── [id]/            # Device detail
│       │   │   └── page.tsx
│       │   └── new/             # Add new device
│       │       └── page.tsx
│       │
│       ├── gsm/                 # GSM Devices
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── new/page.tsx
│       │
│       ├── wifi/                # Wi-Fi Devices
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── new/page.tsx
│       │
│       ├── bluetooth/           # Bluetooth Devices
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── new/page.tsx
│       │
│       ├── gateways/            # Gateways management
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── new/page.tsx
│       │
│       ├── applications/        # Applications management
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── new/page.tsx
│       │
│       ├── gis/                 # GIS mapping
│       │   └── page.tsx
│       │
│       ├── notifications/       # Notifications center
│       │   └── page.tsx
│       │
│       └── settings/            # Settings pages
│           ├── profile/page.tsx
│           ├── api-keys/page.tsx
│           ├── password/page.tsx
│           ├── email-notifications/page.tsx
│           └── theme/page.tsx
│
├── components/                  # React components
│   ├── console/                # Console-specific components
│   │   ├── ConsoleLayout.tsx   # Main console layout wrapper
│   │   ├── ConsoleNav.tsx      # Navigation sidebar
│   │   └── ConsoleHeader.tsx   # Top header bar
│   │
│   ├── devices/                # Device components (shared)
│   │   ├── DeviceCard.tsx
│   │   ├── DeviceList.tsx
│   │   ├── DeviceStats.tsx
│   │   ├── DeviceForm.tsx
│   │   └── device-types/       # Device-specific components
│   │       ├── lorawan/
│   │       │   ├── LoRaWANDeviceCard.tsx
│   │       │   ├── LoRaWANDeviceDetails.tsx
│   │       │   ├── LoRaWANMetrics.tsx
│   │       │   └── LoRaWANForm.tsx
│   │       ├── gsm/
│   │       │   ├── GSMDeviceCard.tsx
│   │       │   ├── GSMSignalStrength.tsx
│   │       │   ├── GSMLocationMap.tsx
│   │       │   └── GSMForm.tsx
│   │       ├── wifi/
│   │       │   ├── WiFiDeviceCard.tsx
│   │       │   ├── WiFiSignalQuality.tsx
│   │       │   ├── WiFiMetrics.tsx
│   │       │   └── WiFiForm.tsx
│   │       └── bluetooth/
│   │           ├── BluetoothDeviceCard.tsx
│   │           ├── BluetoothConnectionStatus.tsx
│   │           ├── BluetoothMetrics.tsx
│   │           └── BluetoothForm.tsx
│   │
│   ├── dashboard/              # Dashboard widgets and components
│   │   ├── widgets/
│   │   │   ├── DeviceStatusWidget.tsx
│   │   │   ├── TelemetryWidget.tsx
│   │   │   ├── MapWidget.tsx
│   │   │   └── ActivityWidget.tsx
│   │   ├── DashboardGrid.tsx
│   │   └── WidgetContainer.tsx
│   │
│   ├── gis/                    # GIS components
│   │   ├── GISMap.tsx
│   │   ├── LayerControl.tsx
│   │   └── DeviceMarker.tsx
│   │
│   ├── layout/                 # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PageHeader.tsx
│   │   └── EmptyState.tsx
│   │
│   └── ui/                     # UI primitives (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── hooks/                      # Custom React hooks
│   ├── devices/
│   │   ├── useLoRaWANDevices.ts
│   │   ├── useGSMDevices.ts
│   │   ├── useWiFiDevices.ts
│   │   └── useBluetoothDevices.ts
│   ├── useApplications.ts
│   ├── useGateways.ts
│   ├── useTelemetry.ts
│   └── useWebSocket.ts
│
├── lib/                        # Utilities and helpers
│   ├── api/                    # API client functions
│   │   ├── client.ts           # Base API client (Axios/Fetch wrapper)
│   │   ├── lorawan.ts
│   │   ├── gsm.ts
│   │   ├── wifi.ts
│   │   ├── bluetooth.ts
│   │   ├── telemetry.ts
│   │   └── logs.ts
│   │
│   ├── gis/                    # GIS utilities
│   │   ├── types.ts
│   │   ├── layerConfig.ts
│   │   └── utils.ts
│   │
│   ├── validations/            # Zod validation schemas
│   │   ├── device.ts
│   │   ├── gateway.ts
│   │   └── application.ts
│   │
│   ├── utils.ts                # General utilities (cn, formatters)
│   └── format.ts               # Data formatting functions
│
├── stores/                     # State management (Zustand/Context)
│   ├── deviceStore.ts
│   ├── widgetStore.ts
│   └── uiStore.ts
│
└── types/                      # TypeScript type definitions
    ├── devices.ts
    ├── telemetry.ts
    ├── dashboard.ts
    └── entities.ts
```

## Key Principles

### 1. **Naming Conventions**
- **Device Types**: Use exact names - `LoRaWAN`, `GSM`, `Wi-Fi`, `Bluetooth`
- **Files**: kebab-case for files (`device-card.tsx`)
- **Components**: PascalCase (`DeviceCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useDevices.ts`)

### 2. **Component Organization**
- **Domain-based**: Group by feature/domain (devices, dashboard, console)
- **Reusability**: Shared components in `components/`, specific ones in feature folders
- **Single Responsibility**: Each component does one thing well

### 3. **State Management**
- **Local State**: useState/useReducer for component state
- **Shared State**: Zustand stores for cross-component state
- **Server State**: React Query/SWR for API data (future)

### 4. **Routing**
- **Consistent Structure**: All device types follow same pattern:
  - `/console/{device-type}` - List page
  - `/console/{device-type}/[id]` - Detail page
  - `/console/{device-type}/new` - Create page

### 5. **API Integration**
- **Centralized**: All API calls in `lib/api/`
- **Type-safe**: Use TypeScript types from `types/`
- **Error Handling**: Consistent error handling across API calls

### 6. **Type Safety**
- **Strict TypeScript**: No `any` types
- **Shared Types**: Import from `@webscada/shared-types` when available
- **Validation**: Zod schemas for runtime validation

## Navigation Structure

```typescript
const navigation = [
  {
    name: 'Dashboard',
    href: '/console/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Devices',
    children: [
      { name: 'LoRaWAN', href: '/console/lorawan' },
      { name: 'GSM', href: '/console/gsm' },
      { name: 'Wi-Fi', href: '/console/wifi' },
      { name: 'Bluetooth', href: '/console/bluetooth' }
    ]
  },
  {
    name: 'Gateways',
    href: '/console/gateways'
  },
  {
    name: 'Applications',
    href: '/console/applications'
  },
  {
    name: 'GIS',
    href: '/console/gis'
  },
  {
    name: 'Notifications',
    href: '/console/notifications'
  }
];
```

## Component Patterns

### Device List Page
```typescript
// Example: /console/lorawan/page.tsx
export default function LoRaWANDevicesPage() {
  const { devices, isLoading } = useLoRaWANDevices();

  return (
    <div>
      <PageHeader
        title="LoRaWAN Devices"
        action={<Link href="/console/lorawan/new">Add Device</Link>}
      />
      <DeviceList devices={devices} loading={isLoading} />
    </div>
  );
}
```

### Device Detail Page
```typescript
// Example: /console/lorawan/[id]/page.tsx
export default function LoRaWANDevicePage({ params }: { params: { id: string } }) {
  const { device, isLoading } = useLoRaWANDevice(params.id);

  return (
    <div>
      <LoRaWANDeviceDetails device={device} />
      <LoRaWANMetrics deviceId={params.id} />
    </div>
  );
}
```

## Migration Plan

1. **Phase 1**: Create new structure
   - Set up new folder structure
   - Create ConsoleLayout component
   - Implement navigation

2. **Phase 2**: Migrate device pages
   - Rename `end-devices` to `lorawan`
   - Create missing list pages
   - Standardize device type pages

3. **Phase 3**: Reorganize components
   - Move components to new structure
   - Create device-specific component folders
   - Update imports

4. **Phase 4**: Clean up
   - Remove old folders (dashboard, devices, esp32, gsm, etc.)
   - Update all imports
   - Remove unused code

## Best Practices

1. **Server Components by Default**: Use 'use client' only when needed
2. **Loading States**: Use Suspense and loading.tsx
3. **Error Boundaries**: Implement error.tsx for error handling
4. **Metadata**: Define metadata for SEO
5. **Parallel Routes**: Use for complex layouts
6. **Code Splitting**: Lazy load heavy components
7. **Accessibility**: Follow WCAG guidelines
8. **Performance**: Optimize images, minimize client JS

## Testing Strategy

- **Unit Tests**: Components and utilities
- **Integration Tests**: API integration
- **E2E Tests**: Critical user flows
- **Visual Tests**: Component snapshots

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
