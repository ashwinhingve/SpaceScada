# ESP32 Frontend Integration Guide

## Overview

This document provides a comprehensive guide to the ESP32 frontend integration in WebSCADA. The frontend provides a complete user interface for managing ESP32 IoT devices, visualizing sensor data in real-time, and controlling devices remotely.

**Version:** 1.0.0
**Date:** 2025-01-15
**Status:** ✅ Complete

---

## Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **State Management:** React Hooks + WebSocket
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Real-time:** Socket.IO Client

### Folder Structure

```
apps/frontend/src/
├── app/
│   └── esp32/
│       ├── page.tsx                    # Main dashboard
│       ├── register/
│       │   └── page.tsx                # Device registration form
│       └── devices/
│           └── [id]/
│               └── page.tsx            # Device detail page
├── components/
│   └── esp32/
│       ├── DeviceCard.tsx              # Device card component
│       ├── DeviceList.tsx              # Device grid/list
│       ├── SensorChart.tsx             # Line chart for sensor data
│       ├── SensorStats.tsx             # Real-time sensor stats
│       ├── ControlPanel.tsx            # Device control interface
│       └── RegisterDeviceForm.tsx      # Registration form
├── hooks/
│   ├── useESP32Devices.ts              # Device management hook
│   ├── useESP32SensorData.ts           # Sensor data hook
│   └── useESP32Control.ts              # Control commands hook
└── lib/
    └── esp32-api.ts                    # API client
```

---

## Components

### 1. DeviceCard

**File:** `components/esp32/DeviceCard.tsx`

Displays a single ESP32 device in a card format.

**Props:**

- `device: ESP32Device` - Device object
- `onDelete?: (deviceId: string) => void` - Delete callback

**Features:**

- Status indicator (online/offline)
- Latest sensor readings
- LED state indicator
- Last seen timestamp
- View and delete actions

**Usage:**

```tsx
import { DeviceCard } from '@/components/esp32/DeviceCard';

<DeviceCard device={device} onDelete={handleDelete} />;
```

### 2. DeviceList

**File:** `components/esp32/DeviceList.tsx`

Displays all ESP32 devices in a responsive grid.

**Features:**

- Automatic device fetching
- Real-time status updates via WebSocket
- Loading and error states
- Empty state with instructions
- Device deletion

**Usage:**

```tsx
import { DeviceList } from '@/components/esp32/DeviceList';

<DeviceList />;
```

### 3. SensorChart

**File:** `components/esp32/SensorChart.tsx`

Line chart for visualizing sensor data over time.

**Props:**

- `data: ESP32SensorData[]` - Array of sensor readings
- `dataKey: 'temperature' | 'humidity' | 'pressure'` - Which value to plot
- `title: string` - Chart title
- `unit: string` - Unit of measurement
- `color?: string` - Line color (default: blue)

**Usage:**

```tsx
import { SensorChart } from '@/components/esp32/SensorChart';

<SensorChart data={history} dataKey="temperature" title="Temperature" unit="°C" color="#ef4444" />;
```

### 4. SensorStats

**File:** `components/esp32/SensorStats.tsx`

Displays latest sensor readings in stat cards.

**Props:**

- `sensorData: ESP32SensorData | null` - Latest readings
- `loading?: boolean` - Loading state

**Features:**

- Temperature, humidity, and pressure cards
- Icons for each metric
- Timestamp display
- Loading skeletons
- No data state

**Usage:**

```tsx
import { SensorStats } from '@/components/esp32/SensorStats';

<SensorStats sensorData={sensorData} loading={loading} />;
```

### 5. ControlPanel

**File:** `components/esp32/ControlPanel.tsx`

Interface for sending control commands to devices.

**Props:**

- `device: ESP32Device` - Device to control

**Features:**

- LED control (On/Off/Toggle)
- Request status command
- Reboot device command
- Real-time LED state indicator
- Command success/error feedback
- Loading state during command execution

**Usage:**

```tsx
import { ControlPanel } from '@/components/esp32/ControlPanel';

<ControlPanel device={device} />;
```

### 6. RegisterDeviceForm

**File:** `components/esp32/RegisterDeviceForm.tsx`

Form for registering new ESP32 devices.

**Features:**

- Multi-section form (device info, MQTT config, GPIO, timing)
- Input validation
- Sensor type selection
- GPIO pin configuration
- MQTT authentication support
- Auto-redirect after registration

**Sections:**

1. **Device Information** - Name and sensor type
2. **MQTT Configuration** - Broker, port, credentials
3. **GPIO Configuration** - Pin assignments
4. **Timing Configuration** - Publish and heartbeat intervals

**Usage:**

```tsx
import { RegisterDeviceForm } from '@/components/esp32/RegisterDeviceForm';

<RegisterDeviceForm />;
```

---

## Hooks

### 1. useESP32Devices

**File:** `hooks/useESP32Devices.ts`

Hook for fetching and managing the device list.

**Returns:**

- `devices: ESP32Device[]` - Array of devices
- `loading: boolean` - Loading state
- `error: Error | null` - Error if any
- `refetch: () => Promise<void>` - Refetch function

**Features:**

- Automatic fetching on mount
- Real-time device online/offline updates via WebSocket
- Error handling

**Usage:**

```tsx
const { devices, loading, error, refetch } = useESP32Devices();
```

### 2. useESP32SensorData

**File:** `hooks/useESP32SensorData.ts`

Hook for fetching and subscribing to real-time sensor data.

**Parameters:**

- `deviceId: string | null` - Device ID to monitor

**Returns:**

- `sensorData: ESP32SensorData | null` - Latest sensor reading
- `loading: boolean` - Loading state
- `error: Error | null` - Error if any
- `refetch: () => Promise<void>` - Refetch function

**Features:**

- Initial data fetch
- WebSocket subscription for real-time updates
- Automatic cleanup on unmount

**Usage:**

```tsx
const { sensorData, loading, error } = useESP32SensorData(deviceId);
```

### 3. useESP32Control

**File:** `hooks/useESP32Control.ts`

Hook for sending control commands to devices.

**Parameters:**

- `deviceId: string | null` - Device ID to control

**Returns:**

- `sending: boolean` - Command sending state
- `error: Error | null` - Error if any
- `sendCommand: (command) => Promise<void>` - Generic command sender
- `toggleLED: () => Promise<void>` - Toggle LED shortcut
- `setLED: (state: boolean) => Promise<void>` - Set LED state
- `requestStatus: () => Promise<void>` - Request status
- `rebootDevice: () => Promise<void>` - Reboot device (with confirmation)

**Usage:**

```tsx
const { sending, toggleLED, setLED, rebootDevice } = useESP32Control(deviceId);

await toggleLED();
await setLED(true);
await rebootDevice();
```

---

## API Client

### ESP32API Class

**File:** `lib/esp32-api.ts`

TypeScript client for ESP32 REST API endpoints.

**Methods:**

#### Device Management

```typescript
// List all devices
listDevices(): Promise<ESP32Device[]>

// Get device by ID
getDevice(deviceId: string): Promise<ESP32Device>

// Register new device
registerDevice(request: RegisterDeviceRequest): Promise<ESP32Device>

// Update device configuration
updateDevice(deviceId: string, request: UpdateDeviceRequest): Promise<ESP32Device>

// Delete device
deleteDevice(deviceId: string): Promise<void>
```

#### Sensor Data

```typescript
// Get latest sensor data
getDeviceSensorData(deviceId: string): Promise<ESP32SensorData>

// Get sensor history
getDeviceSensorHistory(
  deviceId: string,
  params?: SensorDataHistoryParams
): Promise<SensorDataHistoryResponse>
```

#### Control

```typescript
// Send control command
sendControlCommand(
  deviceId: string,
  command: ESP32ControlCommand
): Promise<void>
```

**Usage:**

```typescript
import { esp32API } from '@/lib/esp32-api';

// List devices
const devices = await esp32API.listDevices();

// Register device
const device = await esp32API.registerDevice({
  name: 'Office Sensor',
  sensorType: ESP32SensorType.DHT22,
  mqttBroker: 'localhost',
  mqttPort: 1883,
});

// Get sensor data
const sensorData = await esp32API.getDeviceSensorData(deviceId);

// Send control command
await esp32API.sendControlCommand(deviceId, {
  action: ESP32Action.SET_LED,
  ledState: true,
});
```

---

## Pages

### 1. ESP32 Dashboard (`/esp32`)

**File:** `app/esp32/page.tsx`

Main landing page for ESP32 integration.

**Features:**

- Device grid/list view
- Register device button
- Getting started instructions
- Real-time device status updates

**Route:** `/esp32`

### 2. Register Device (`/esp32/register`)

**File:** `app/esp32/register/page.tsx`

Device registration page.

**Features:**

- Multi-section registration form
- Next steps instructions
- MQTT configuration tips
- Auto-redirect to device detail after registration

**Route:** `/esp32/register`

### 3. Device Detail (`/esp32/devices/[id]`)

**File:** `app/esp32/devices/[id]/page.tsx`

Detailed view for a single device.

**Features:**

- Real-time sensor stats
- Device control panel
- Historical data charts
- Time range selector (1h, 6h, 24h, 7d)
- Temperature and humidity charts
- Device status indicator

**Route:** `/esp32/devices/:id`

---

## Real-Time Updates

The frontend uses Socket.IO for real-time updates.

### WebSocket Events

#### Client → Server (Subscribe)

```typescript
socket.emit('subscribe:esp32', [deviceId]);
socket.emit('unsubscribe:esp32', [deviceId]);
```

#### Server → Client (Broadcasts)

```typescript
// Sensor data update
socket.on('esp32:sensor-data', (data: { deviceId; sensorData }) => {
  // Update UI with new sensor data
});

// Device online
socket.on('esp32:device-online', (data: { deviceId; timestamp }) => {
  // Mark device as online
});

// Device offline
socket.on('esp32:device-offline', (data: { deviceId; timestamp }) => {
  // Mark device as offline
});

// Control state update
socket.on('esp32:control-state', (data: { deviceId; controlState }) => {
  // Update control state
});

// Heartbeat
socket.on('esp32:heartbeat', (data: ESP32HeartbeatPayload) => {
  // Process heartbeat
});
```

### Integration Example

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent({ deviceId }: { deviceId: string }) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Subscribe
    socket.emit('subscribe:esp32', [deviceId]);

    // Listen for updates
    socket.on('esp32:sensor-data', handleSensorData);

    return () => {
      socket.emit('unsubscribe:esp32', [deviceId]);
      socket.off('esp32:sensor-data', handleSensorData);
    };
  }, [socket, deviceId]);
}
```

---

## Styling

### Tailwind CSS Classes

All components use Tailwind CSS for styling with dark mode support.

**Common Patterns:**

```tsx
// Card
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">

// Button (Primary)
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

// Button (Secondary)
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">

// Status Badge (Online)
<span className="px-3 py-1 rounded-full bg-green-100 text-green-800">

// Input Field
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">

// Alert (Error)
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-red-800">Error message</p>
</div>
```

### Dark Mode

All components support dark mode automatically using Tailwind's `dark:` variant.

```tsx
<div className="text-gray-900 dark:text-white">
  <p className="text-gray-600 dark:text-gray-400">Description text</p>
</div>
```

---

## Type Safety

All components and hooks are fully typed with TypeScript.

### Shared Types

From `@webscada/shared-types`:

```typescript
import {
  ESP32Device,
  ESP32SensorData,
  ESP32ControlCommand,
  ESP32SensorType,
  ESP32Action,
  DeviceStatus,
} from '@webscada/shared-types';
```

### API Types

From `lib/esp32-api.ts`:

```typescript
import {
  RegisterDeviceRequest,
  UpdateDeviceRequest,
  SensorDataHistoryParams,
  SensorDataHistoryResponse,
} from '@/lib/esp32-api';
```

---

## Testing

### Manual Testing Checklist

#### Device Management

- [ ] View device list
- [ ] Register new device
- [ ] View device details
- [ ] Delete device
- [ ] See device online/offline status update

#### Sensor Data

- [ ] View real-time sensor stats
- [ ] See sensor data update every 5 seconds
- [ ] Switch time ranges (1h, 6h, 24h, 7d)
- [ ] View temperature chart
- [ ] View humidity chart

#### Device Control

- [ ] Toggle LED
- [ ] Turn LED on
- [ ] Turn LED off
- [ ] Request status
- [ ] Reboot device

#### Real-Time Updates

- [ ] WebSocket connection established
- [ ] Sensor data updates in real-time
- [ ] Device status changes reflected
- [ ] LED state changes reflected

---

## Environment Variables

Required in `.env.local`:

```bash
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## Common Issues & Solutions

### 1. API Connection Failed

**Symptoms:** Devices don't load, 404 errors

**Solutions:**

- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Ensure CORS is configured in backend

### 2. WebSocket Not Connecting

**Symptoms:** No real-time updates

**Solutions:**

- Check `NEXT_PUBLIC_WS_URL` is set correctly
- Verify backend WebSocket server is running
- Check browser console for connection errors

### 3. Charts Not Rendering

**Symptoms:** Empty chart area, console errors

**Solutions:**

- Ensure Recharts is installed: `pnpm add recharts`
- Check sensor data has values
- Verify data array is not empty

### 4. Type Errors

**Symptoms:** TypeScript compilation errors

**Solutions:**

- Run `pnpm install` to ensure all types are installed
- Check imports from `@webscada/shared-types`
- Rebuild shared types: `pnpm build --filter=@webscada/shared-types`

---

## Performance Optimization

### Best Practices

1. **Memoization**
   - Use `React.memo` for expensive components
   - Use `useMemo` for computed values
   - Use `useCallback` for event handlers

2. **Code Splitting**
   - Next.js automatically code-splits pages
   - Use dynamic imports for large components

3. **Data Fetching**
   - Use SWR or React Query for caching (future enhancement)
   - Implement pagination for large device lists
   - Limit historical data queries

4. **WebSocket**
   - Unsubscribe when component unmounts
   - Throttle high-frequency updates
   - Use rooms for targeted broadcasting

---

## Future Enhancements

### Planned Features

- [ ] Device groups and filtering
- [ ] Export sensor data to CSV
- [ ] Alarm/threshold configuration UI
- [ ] Multiple relay control
- [ ] OTA firmware update interface
- [ ] Device configuration wizard
- [ ] Real-time notifications
- [ ] Dashboard widgets
- [ ] Multi-device comparison charts
- [ ] Device firmware version display

### Technical Improvements

- [ ] Add SWR or React Query for caching
- [ ] Implement optimistic UI updates
- [ ] Add E2E tests with Playwright
- [ ] Add component tests with Jest
- [ ] Implement virtual scrolling for large lists
- [ ] Add service worker for offline support
- [ ] Implement push notifications

---

## Contributing

When adding new features:

1. Follow existing component patterns
2. Use TypeScript for all files
3. Support dark mode with Tailwind
4. Add error handling and loading states
5. Document props and usage
6. Test on mobile devices

---

## Support

For issues or questions:

- Check this guide first
- Review component source code
- Check browser console for errors
- Verify backend API is responding
- Test WebSocket connection manually

---

**End of Frontend Guide**
