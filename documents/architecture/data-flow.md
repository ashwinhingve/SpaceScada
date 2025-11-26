# Data Flow Architecture

This document describes the data flow within the WebSCADA system, from device data collection to real-time visualization.

## Overview

The WebSCADA system implements a multi-layered data flow architecture designed for real-time industrial monitoring and control:

```
┌─────────────┐
│   Devices   │ (ESP32, GSM, LoRaWAN, Wi-Fi, Bluetooth)
└──────┬──────┘
       │ MQTT/HTTP/WebSocket
       ▼
┌─────────────┐
│  Gateways   │ (Protocol Translation)
└──────┬──────┘
       │ Normalized Data
       ▼
┌─────────────┐
│   Backend   │ (Fastify API + WebSocket)
│   Service   │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│PostgreSQL│   │  Redis   │   │InfluxDB  │   │Socket.io │
│(Metadata)│   │ (Cache)  │   │(Telemetry│   │(Real-time│
│          │   │          │   │         )│   │ Stream)  │
└──────────┘   └──────────┘   └──────────┘   └────┬─────┘
                                                    │
                                                    ▼
                                             ┌─────────────┐
                                             │  Frontend   │
                                             │(Next.js App)│
                                             └─────────────┘
```

## Data Flow Layers

### 1. Device Layer

**Protocols Supported:**
- MQTT (Wi-Fi devices, standard IoT)
- HTTP/HTTPS (REST APIs, ESP32)
- WebSocket (Real-time bidirectional)
- LoRaWAN (Long-range, low-power via ChirpStack)
- GSM/GPRS (2G/3G/4G cellular)
- Bluetooth LE (Short-range sensors)

**Device Data Structure:**
```typescript
{
  deviceId: string;
  protocol: 'mqtt' | 'http' | 'lorawan' | 'gsm' | 'bluetooth';
  timestamp: Date;
  telemetry: {
    temperature?: number;
    pressure?: number;
    flow?: number;
    status?: string;
    [key: string]: any;
  };
  metadata: {
    signalStrength?: number;
    batteryLevel?: number;
    location?: { lat: number; lon: number };
  };
}
```

### 2. Gateway/Translation Layer

**Purpose:** Normalize different protocols into a common format

**Process:**
1. Device sends data via native protocol
2. Gateway receives and validates data
3. Protocol-specific parser extracts telemetry
4. Data normalized to standard format
5. Forward to Backend Service

**Protocol Handlers:**
- `packages/protocols/src/mqtt.ts` - MQTT protocol handler
- `packages/protocols/src/lorawan.ts` - LoRaWAN via ChirpStack
- `apps/backend/src/services/esp32.service.ts` - ESP32 HTTP handler
- `apps/backend/src/services/gsm.service.ts` - GSM MQTT handler
- `apps/backend/src/services/bluetooth.service.ts` - Bluetooth handler

### 3. Backend Processing Layer

**Components:**
- **Fastify API Server** (`apps/backend/src/server.ts`)
- **WebSocket Handler** (`apps/backend/src/websocket.ts`)
- **Service Layer** (`apps/backend/src/services/`)

**Data Processing Flow:**

```typescript
// 1. Receive device data
POST /api/devices/:id/telemetry
  │
  ├─→ Validate request (Zod schemas)
  ├─→ Process telemetry data
  ├─→ Store in PostgreSQL (metadata)
  ├─→ Store in InfluxDB (time-series)
  ├─→ Cache in Redis (latest values)
  └─→ Publish to Socket.io (real-time)

// 2. Real-time subscription
WebSocket /ws
  │
  ├─→ Client subscribes to device updates
  ├─→ Backend publishes on new telemetry
  └─→ Client receives real-time updates
```

### 4. Storage Layer

**PostgreSQL** (Relational Data):
- Device metadata and configuration
- User accounts and settings
- Applications and gateways
- API keys and sessions
- Alarms and notifications

**Redis** (Caching):
- Latest device telemetry (fast access)
- WebSocket session management
- Rate limiting data
- Pub/sub for inter-service communication

**InfluxDB** (Time-Series Data):
- Historical telemetry measurements
- Aggregated metrics
- Long-term trend data
- Performance monitoring data

### 5. Real-time Distribution Layer

**Socket.io WebSocket Server:**
```typescript
// Backend publishes
io.to(`device:${deviceId}`).emit('telemetry', data);

// Frontend subscribes
socket.on('telemetry', (data) => {
  updateDashboard(data);
});
```

**Channels:**
- `device:${deviceId}` - Individual device updates
- `application:${appId}` - Application-wide updates
- `alarms` - Alarm notifications
- `system` - System-wide events

### 6. Frontend Presentation Layer

**Data Consumption:**
```typescript
// 1. Initial data load (HTTP)
const devices = await fetch('/api/devices');

// 2. Real-time updates (WebSocket)
useEffect(() => {
  socket.on('telemetry', handleUpdate);
  return () => socket.off('telemetry');
}, []);
```

**State Management:**
- React Context for global state
- Local state for component-specific data
- Socket.io client for real-time updates

## Data Flow Patterns

### Pattern 1: Device Telemetry Upload

```
Device → Gateway → Backend → [PostgreSQL + Redis + InfluxDB] → Socket.io → Frontend
                                                                    │
                                                                    └→ Dashboard Update
```

### Pattern 2: User Control Command

```
Frontend → Backend → Validate → Queue → Gateway → Device
                        │
                        └→ Store Command Log (PostgreSQL)
```

### Pattern 3: Alarm Processing

```
Backend → Detect Threshold → Create Alarm (PostgreSQL)
           │                    │
           │                    └→ Socket.io → Frontend Alert
           └→ Send Notification (Email/SMS)
```

### Pattern 4: Historical Query

```
Frontend → Backend → InfluxDB Query → Aggregate → Return JSON → Chart
```

## Performance Optimizations

### Caching Strategy
- Redis caches latest telemetry (TTL: 5 minutes)
- Browser caches static assets (service worker)
- Backend caches device configurations (in-memory)

### Data Aggregation
- InfluxDB downsampling for old data
- Pre-aggregated metrics (hourly, daily averages)
- Continuous queries for common analytics

### Real-time Optimizations
- Socket.io rooms for selective broadcasting
- Binary protocol for telemetry (optional)
- Message batching for high-frequency updates

## Scalability Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Redis pub/sub for inter-instance communication
- Socket.io with Redis adapter for sticky sessions

### Vertical Scaling
- PostgreSQL connection pooling (max 20 connections)
- Redis cluster for high-throughput scenarios
- InfluxDB sharding for time-series data

## Security in Data Flow

### Device Authentication
- API key authentication for devices
- TLS/SSL for all communications
- Device certificates for sensitive deployments

### Data Validation
- Zod schemas validate all incoming data
- Sanitize inputs to prevent injection
- Rate limiting on API endpoints

### Access Control
- JWT tokens for user authentication
- Role-based access control (RBAC)
- Device-level permissions

## Monitoring Data Flow

### Metrics Tracked
- Message throughput (messages/second)
- Processing latency (end-to-end)
- Storage utilization (PostgreSQL, InfluxDB, Redis)
- WebSocket connection count

### Health Checks
- `/health` endpoint for each service
- Database connectivity checks
- Queue depth monitoring
- Memory and CPU utilization

## Error Handling

### Retry Mechanisms
- Exponential backoff for failed requests
- Dead letter queue for persistent failures
- Circuit breaker for downstream services

### Data Integrity
- Idempotent operations where possible
- Transaction support for critical operations
- Data validation at every layer

## Future Enhancements

- **Stream Processing**: Apache Kafka for high-volume scenarios
- **Edge Computing**: Local processing at gateway level
- **ML Integration**: Real-time anomaly detection
- **Multi-tenancy**: Isolated data flows per organization

---

**Last Updated**: 2025-11-25
