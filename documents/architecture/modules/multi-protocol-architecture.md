# Enterprise Multi-Protocol Device Connectivity Architecture

**Document Version:** 1.0.0
**Last Updated:** 2025-11-27
**Status:** Architecture Approved - Implementation In Progress

---

## Executive Summary

This document describes the enterprise-grade multi-protocol device connectivity architecture for WebSCADA, designed to support:

- **7+ industrial protocols**: LoRaWAN, GSM/GPRS, Wi-Fi, Bluetooth/BLE, MQTT Sparkplug B, OPC UA, Modbus TCP/RTU
- **Edge-first data normalization** with Sparkplug B
- **Protocol-agnostic device management** through unified abstraction layer
- **Zero-touch provisioning** and automated lifecycle management
- **Horizontal scalability** and high availability

### Key Architectural Decisions

| Decision                             | Rationale                                                 |
| ------------------------------------ | --------------------------------------------------------- |
| **Edge-First Normalization**         | Reduce bandwidth, enable offline operation, lower latency |
| **Sparkplug B as Unified Format**    | Industry standard, efficient, supports SCADA requirements |
| **Plugin Architecture**              | Easy protocol additions, hot-reload, version management   |
| **Unified Device Manager**           | Avoid code duplication, consistent behavior               |
| **Protocol Abstraction Layer (PAL)** | Protocol-agnostic application code                        |

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                      DEVICES LAYER                            │
│  LoRaWAN │ GSM │ Wi-Fi │ BLE │ Modbus │ OPC UA │ MQTT       │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                   PROTOCOL GATEWAY SERVICE                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Protocol Abstraction Layer (PAL)               │  │
│  │  • IProtocolAdapter interface                         │  │
│  │  • Common read/write/subscribe operations             │  │
│  │  • Connection management                              │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │       Protocol Plugin Registry                         │  │
│  │  • Dynamic plugin loading                             │  │
│  │  • Version management                                 │  │
│  │  • Connection pooling                                 │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │  Protocol Plugins (Adapters)                          │  │
│  │  [MQTT] [Modbus] [OPC UA] [LoRaWAN] [GSM] [...]      │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │      Sparkplug B Normalizer                           │  │
│  │  • Protocol → Sparkplug B conversion                  │  │
│  │  • NBIRTH/DBIRTH message generation                   │  │
│  │  • Data type mapping                                  │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │      Edge Buffer & Message Queue                      │  │
│  │  • Local SQLite buffer for offline                    │  │
│  │  • Redis Streams / Kafka                              │  │
│  └────────────────────┬───────────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────────┘
                        │
          Normalized Telemetry (Sparkplug B)
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                 BACKEND SERVICES (Cloud)                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Device     │  │  Telemetry   │  │  Alarm Engine   │   │
│  │   Manager    │  │   Service    │  │                 │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────┐
│         STORAGE LAYER                                         │
│  PostgreSQL (Metadata) │ InfluxDB (Time-Series) │ Redis      │
└───────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Protocol Abstraction Layer (PAL)

**Location:** `packages/protocols/src/abstraction/`

**Purpose:** Unified interface for all protocol implementations.

**Key Interfaces:**

```typescript
interface IProtocolAdapter {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  read(address: string): Promise<DataPoint>;
  readBulk(request: BulkReadRequest): Promise<BulkReadResponse>;
  write(address: string, value: unknown): Promise<void>;
  subscribe(addresses: string[], callback: DataCallback): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
  discoverDevices(): Promise<DeviceDiscovery[]>;
  getCapabilities(): ProtocolCapabilities;
}
```

**Implementation Pattern:**

```typescript
import { BaseProtocolAdapter } from '@webscada/protocols/abstraction';

class ModbusTCPAdapter extends BaseProtocolAdapter {
  protected async doConnect(config: ConnectionConfig): Promise<void> {
    // Modbus-specific connection logic
  }

  protected async doRead(address: string): Promise<DataPoint> {
    // Modbus-specific read logic
  }

  // ... other implementations
}
```

**Benefits:**

- Protocol-agnostic application code
- Consistent error handling
- Automatic metrics collection (read/write latency, success rate)
- Built-in health monitoring

---

### 2. Protocol Plugin Registry

**Location:** `packages/protocols/src/registry/`

**Purpose:** Manage protocol adapter plugins with dynamic loading and lifecycle management.

**Features:**

- Dynamic plugin registration
- Hot-reload capability
- Version management
- Connection pooling
- Plugin statistics

**Usage Example:**

```typescript
import { ProtocolRegistry } from '@webscada/protocols/registry';
import { ModbusTCPAdapter } from './adapters/modbus-tcp';

// Register plugin
const registry = ProtocolRegistry.getInstance();
registry.register(
  {
    name: 'Modbus TCP',
    protocol: ProtocolType.MODBUS_TCP,
    version: '1.0.0',
    description: 'Modbus TCP protocol adapter',
    capabilities: {
      supportsRead: true,
      supportsWrite: true,
      supportsSubscribe: false,
      supportsBulkOperations: true,
      supportsDiscovery: true,
      maxConcurrentConnections: 10,
      reconnectionSupported: true,
    },
  },
  () => new ModbusTCPAdapter()
);

// Create adapter instance
const adapter = registry.createAdapter(ProtocolType.MODBUS_TCP, 'instance-1');
await adapter.connect({
  protocol: ProtocolType.MODBUS_TCP,
  host: '192.168.1.100',
  port: 502,
});

// Read data
const dataPoint = await adapter.read('40001');
console.log(dataPoint);
```

---

### 3. Sparkplug B Normalization Layer

**Location:** `packages/protocols/src/normalization/`

**Purpose:** Convert protocol-specific data to unified Sparkplug B format.

**Key Components:**

1. **SparkplugNormalizer**: Core normalization engine
2. **ProtocolNormalizationHelpers**: Protocol-specific utilities

**Usage Example:**

```typescript
import { SparkplugNormalizer } from '@webscada/protocols/normalization';
import { DataPoint, DataType, DataQuality } from '@webscada/protocols/abstraction';

const normalizer = new SparkplugNormalizer();

// Convert DataPoint to Sparkplug B metric
const dataPoint: DataPoint = {
  address: '40001',
  name: 'temperature',
  value: 25.5,
  dataType: DataType.FLOAT,
  quality: DataQuality.GOOD,
  timestamp: Date.now(),
  unit: '°C',
};

const metric = normalizer.dataPointToMetric(dataPoint);

// Create telemetry message
const message = normalizer.createTelemetryMessage(
  ProtocolType.MODBUS_TCP,
  'gateway-001',
  'plant-1',
  'edge-node-1',
  'device-123',
  [dataPoint],
  'NDATA'
);

// Publish to MQTT
mqtt.publish(`spBv1.0/plant-1/NDATA/edge-node-1/device-123`, JSON.stringify(message));
```

**Sparkplug B Message Types:**

| Type       | Purpose                  | When to Use                    |
| ---------- | ------------------------ | ------------------------------ |
| **NBIRTH** | Node birth certificate   | Gateway/Edge node comes online |
| **NDEATH** | Node death certificate   | Gateway/Edge node goes offline |
| **DBIRTH** | Device birth certificate | Device comes online            |
| **DDEATH** | Device death certificate | Device goes offline            |
| **NDATA**  | Node data                | Edge node telemetry            |
| **DDATA**  | Device data              | Device telemetry               |
| **NCMD**   | Node command             | Command to edge node           |
| **DCMD**   | Device command           | Command to device              |

---

### 4. Protocol Gateway Service

**Location:** `apps/gateway-service/` (to be created)

**Purpose:** Edge service that terminates protocols and normalizes data.

**Deployment Options:**

1. **Edge Gateway** (Raspberry Pi, Industrial PC)
   - Deployed at customer site
   - Terminates industrial protocols locally
   - Publishes to cloud via MQTT Sparkplug B
   - Offline buffering

2. **Cloud Gateway** (Docker Container)
   - Deployed in cloud infrastructure
   - For lightweight devices (ESP32, GSM) that connect directly to cloud
   - Protocol translation at cloud edge

**Service Structure:**

```typescript
class GatewayService {
  private registry: ProtocolRegistry;
  private normalizer: SparkplugNormalizer;
  private buffer: EdgeBuffer;
  private mqtt: MQTTClient;

  async start(): Promise<void> {
    // 1. Initialize protocol registry
    this.registerProtocols();

    // 2. Load device configurations
    const devices = await this.loadDeviceConfigs();

    // 3. Connect to devices
    for (const device of devices) {
      await this.connectDevice(device);
    }

    // 4. Start data pipeline
    this.startDataPipeline();

    // 5. Connect to cloud MQTT broker
    await this.mqtt.connect();
  }

  private async connectDevice(device: DeviceConfig): Promise<void> {
    const adapter = this.registry.createAdapter(device.protocol, device.id);
    await adapter.connect(device.connectionConfig);

    // Subscribe to data changes
    await adapter.subscribe(device.tags, (dataPoint) => {
      this.handleDataPoint(device, dataPoint);
    });
  }

  private async handleDataPoint(device: DeviceConfig, dataPoint: DataPoint): Promise<void> {
    // 1. Normalize to Sparkplug B
    const message = this.normalizer.createTelemetryMessage(
      device.protocol,
      this.gatewayId,
      device.groupId,
      device.edgeNodeId,
      device.deviceId,
      [dataPoint],
      'DDATA'
    );

    // 2. Buffer for offline resilience
    await this.buffer.enqueue(message);

    // 3. Publish to cloud
    await this.publishMessage(message);
  }
}
```

---

## Protocol-Specific Implementation

### LoRaWAN Integration

**Architecture:**

```
LoRaWAN Devices
     ↓
LoRaWAN Gateway (Hardware)
     ↓
ChirpStack Network Server
     ↓
WebSCADA ChirpStack Adapter
     ↓
Protocol Gateway
```

**Implementation:**

```typescript
class LoRaWANAdapter extends BaseProtocolAdapter {
  private chirpstackClient: ChirpStackAPIClient;

  protected async doConnect(config: ConnectionConfig): Promise<void> {
    this.chirpstackClient = new ChirpStackAPIClient(config.host);
    await this.chirpstackClient.authenticate();
  }

  async subscribe(deviceEUIs: string[], callback: DataCallback): Promise<string> {
    // Subscribe to ChirpStack MQTT uplink topic
    const topic = 'application/+/device/+/event/up';
    return this.mqttClient.subscribe(topic, (message) => {
      const uplink = this.parseUplinkMessage(message);
      const dataPoints = this.decodePayload(uplink.payload);
      dataPoints.forEach(callback);
    });
  }

  async discoverDevices(): Promise<DeviceDiscovery[]> {
    const devices = await this.chirpstackClient.listDevices();
    return devices.map((dev) => ({
      deviceId: ProtocolNormalizationHelpers.normalizeLoRaWANDeviceId(dev.devEUI),
      protocol: ProtocolType.LORAWAN,
      address: dev.devEUI,
      capabilities: ['temperature', 'humidity'],
      metadata: {
        applicationId: dev.applicationId,
        deviceClass: dev.deviceProfileId,
      },
    }));
  }
}
```

---

### GSM/GPRS Integration

**Architecture:**

```
GSM Devices (A7670C Modem)
     ↓
Cellular Network (2G/3G/4G)
     ↓
HTTP API Endpoint
     ↓
GSM Adapter
     ↓
Protocol Gateway
```

**Key Features:**

- AT command support
- SMS messaging
- GPS location tracking
- HTTP and MQTT over cellular
- Network status monitoring

**Device Registration:**

```typescript
interface GSMDeviceConfig {
  imei: string;
  apn: string;
  mqttConfig?: {
    broker: string;
    port: number;
    topic: string;
  };
}

// Zero-touch provisioning via first contact
async function provisionGSMDevice(imei: string, apn: string): Promise<GSMDevice> {
  const deviceId = ProtocolNormalizationHelpers.normalizeGSMDeviceId(imei);

  const device: GSMDevice = {
    id: deviceId,
    device_id: deviceId,
    name: `GSM Device ${imei}`,
    device_type: DeviceType.GSM_ESP32,
    status: DeviceStatus.PROVISIONING,
    config: { imei, apn },
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Save to database
  await deviceRegistry.create(device);

  // Send provisioning SMS
  await smsService.send(imei, 'PROV', {
    mqtt_broker: config.mqttBroker,
    mqtt_topic: `devices/${deviceId}/telemetry`,
  });

  return device;
}
```

---

### Wi-Fi (ESP32) Integration

**Architecture:**

```
ESP32 Devices
     ↓
Wi-Fi Network
     ↓
MQTT Broker (Mosquitto)
     ↓
MQTT Adapter
     ↓
Protocol Gateway
```

**Topic Structure:**

```
devices/{deviceId}/telemetry    - Device → Cloud
devices/{deviceId}/control      - Cloud → Device
devices/{deviceId}/status       - Device status
devices/{deviceId}/config       - Configuration updates
```

**Sparkplug B Migration:**

```typescript
// Current: Custom MQTT
devices/esp32-001/telemetry
{ "temperature": 25.5, "humidity": 60 }

// Target: Sparkplug B
spBv1.0/plant-1/DDATA/gateway-001/esp32-001
{
  "timestamp": 1732732800000,
  "metrics": [
    { "name": "temperature", "dataType": 9, "floatValue": 25.5 },
    { "name": "humidity", "dataType": 9, "floatValue": 60 }
  ],
  "seq": 42
}
```

---

### Modbus TCP/RTU Integration

**Architecture:**

```
Modbus Devices (PLCs, RTUs)
     ↓
Modbus TCP (Ethernet) or Modbus RTU (Serial)
     ↓
Modbus Adapter
     ↓
Protocol Gateway
```

**Address Format:**

```typescript
// Format: {slaveId}:{functionCode}:{address}
// Example: 1:3:40001 (Slave 1, Function 3, Register 40001)

const address = ProtocolNormalizationHelpers.normalizeModbusAddress(
  3, // Function code (Read Holding Registers)
  40001, // Register address
  1 // Slave ID
);

const dataPoint = await modbusAdapter.read(address);
```

**Bulk Read Optimization:**

```typescript
// Instead of 100 individual reads
for (let i = 0; i < 100; i++) {
  await modbusAdapter.read(`1:3:${40001 + i}`);
}

// Use bulk read
const result = await modbusAdapter.readBulk({
  addresses: Array.from({ length: 100 }, (_, i) => `1:3:${40001 + i}`),
  timeout: 5000,
});
```

---

### OPC UA Integration

**Architecture:**

```
OPC UA Servers (SCADA, PLCs)
     ↓
OPC UA Client Connection
     ↓
OPC UA Adapter
     ↓
Protocol Gateway
```

**Key Features:**

- Node browsing and discovery
- Subscription-based data change notifications
- Historical data access
- Security modes (None, Sign, Sign & Encrypt)

**Node Address Format:**

```typescript
// Format: ns={namespace};i={identifier} or ns={namespace};s={string}
const nodeId = ProtocolNormalizationHelpers.normalizeOpcUaNodeId(2, 'Temperature');
// Result: "ns=2;s=Temperature"

const dataPoint = await opcuaAdapter.read(nodeId);
```

---

## Device Lifecycle Management

### Lifecycle States

```typescript
enum DeviceLifecycleState {
  DISCOVERED = 'DISCOVERED', // Device found on network
  REGISTERING = 'REGISTERING', // Identity verification in progress
  PROVISIONING = 'PROVISIONING', // Configuration being pushed
  ACTIVATED = 'ACTIVATED', // Ready for operation
  ONLINE = 'ONLINE', // Actively communicating
  OFFLINE = 'OFFLINE', // Not responding
  SLEEPING = 'SLEEPING', // Power-save mode
  ERROR = 'ERROR', // Communication error
  UPGRADING = 'UPGRADING', // Firmware update in progress
  DECOMMISSIONED = 'DECOMMISSIONED', // Removed from service
}
```

### State Machine

```typescript
class DeviceLifecycleManager {
  private stateMachine = new StateMachine<DeviceLifecycleState>({
    initial: DeviceLifecycleState.DISCOVERED,
    transitions: [
      { from: 'DISCOVERED', to: 'REGISTERING', event: 'register' },
      { from: 'REGISTERING', to: 'PROVISIONING', event: 'verified' },
      { from: 'PROVISIONING', to: 'ACTIVATED', event: 'configured' },
      { from: 'ACTIVATED', to: 'ONLINE', event: 'connect' },
      { from: 'ONLINE', to: 'OFFLINE', event: 'disconnect' },
      { from: 'OFFLINE', to: 'ONLINE', event: 'reconnect' },
      { from: '*', to: 'ERROR', event: 'error' },
      { from: 'ERROR', to: 'OFFLINE', event: 'recover' },
      { from: '*', to: 'DECOMMISSIONED', event: 'decommission' },
    ],
  });

  async transition(deviceId: string, event: string): Promise<void> {
    const device = await this.deviceRegistry.get(deviceId);
    const newState = this.stateMachine.transition(device.status, event);

    // Execute state-specific actions
    await this.executeStateActions(device, newState);

    device.status = newState;
    await this.deviceRegistry.update(device);
  }
}
```

### Zero-Touch Provisioning

**LoRaWAN OTAA Flow:**

```
Device Powers On
    ↓
Send Join Request
    ↓
ChirpStack Validates AppEUI/AppKey
    ↓
Send Join Accept
    ↓
WebSCADA Receives Join Event
    ↓
Auto-create Device Record
    ↓
Assign Application Config
    ↓
Device ACTIVATED
```

**MQTT Sparkplug B Flow:**

```
Device Connects to MQTT
    ↓
Publish NBIRTH with Capabilities
    ↓
WebSCADA Parses NBIRTH
    ↓
Auto-create Device Record
    ↓
Publish NCMD with Config
    ↓
Device ACTIVATED
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅ **COMPLETED**

- ✅ Protocol Abstraction Layer (PAL) interface
- ✅ Base protocol adapter implementation
- ✅ Protocol plugin registry system
- ✅ Sparkplug B normalizer

### Phase 2: Gateway Service (Weeks 3-4)

- [ ] Create gateway-service app
- [ ] Edge buffering with SQLite
- [ ] Message queue integration (Redis Streams)
- [ ] Gateway-to-cloud MQTT publisher
- [ ] Gateway health monitoring

### Phase 3: Protocol Implementations (Weeks 5-8)

- [ ] Complete Modbus TCP adapter
- [ ] Complete Modbus RTU adapter
- [ ] Complete OPC UA adapter
- [ ] Enhance MQTT adapter with Sparkplug B
- [ ] Test all protocol adapters

### Phase 4: Device Manager (Weeks 9-10)

- [ ] Unified device manager service
- [ ] Device lifecycle state machine
- [ ] Zero-touch provisioning engine
- [ ] Device capability discovery
- [ ] Device health monitoring

### Phase 5: Migration & Integration (Weeks 11-12)

- [ ] Migrate existing device services to new architecture
- [ ] Update frontend to use normalized data
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation

---

## Deployment Guide

### Edge Gateway Deployment

```yaml
# docker-compose.gateway.yml
version: '3.8'
services:
  gateway:
    image: webscada/gateway-service:latest
    environment:
      - GATEWAY_ID=gateway-001
      - GROUP_ID=plant-1
      - MQTT_BROKER=mqtt://cloud.example.com:1883
      - BUFFER_DB=/data/buffer.db
    volumes:
      - ./data:/data
      - ./config/devices.json:/config/devices.json
    restart: always
```

### Cloud Deployment (Kubernetes)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway-service
  template:
    metadata:
      labels:
        app: gateway-service
    spec:
      containers:
        - name: gateway
          image: webscada/gateway-service:latest
          env:
            - name: GATEWAY_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: MQTT_BROKER
              value: 'mqtt://mosquitto:1883'
            - name: REDIS_URL
              value: 'redis://redis:6379'
```

---

## Performance Considerations

### Throughput Targets

| Scenario           | Target | Notes                |
| ------------------ | ------ | -------------------- |
| Data points/second | 10,000 | Per gateway instance |
| Concurrent devices | 1,000  | Per gateway instance |
| Message latency    | <100ms | Edge to cloud        |
| Offline buffer     | 7 days | Local storage        |

### Optimization Strategies

1. **Bulk Operations**
   - Use `readBulk()` for Modbus register blocks
   - Batch database writes
   - Aggregate metrics before publishing

2. **Connection Pooling**
   - Reuse protocol connections
   - Configurable pool size
   - Idle timeout

3. **Dead-Band Filtering**
   - Only send changes above threshold
   - Reduce bandwidth by 60-80%

4. **Compression**
   - Enable MQTT compression
   - Use Sparkplug B with Protobuf encoding

---

## Security Best Practices

### Device Authentication

1. **LoRaWAN**: OTAA with AppKey
2. **MQTT**: X.509 certificates or PSK
3. **OPC UA**: Username/Password + Certificate
4. **Modbus**: Network isolation + VPN

### Data Encryption

- TLS 1.2+ for all network communication
- Certificate-based authentication
- Regular key rotation

### Access Control

- Role-based access control (RBAC)
- Device-level permissions
- Audit logging

---

## Monitoring & Observability

### Gateway Metrics

```typescript
interface GatewayMetrics {
  uptime: number;
  connectedDevices: number;
  messagesReceived: number;
  messagesPublished: number;
  bufferSize: number;
  errorRate: number;
  avgMessageLatency: number;
}
```

### Health Checks

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    gateway: await gatewayService.getHealth(),
    protocols: registry.getAllStatistics(),
    buffer: await buffer.getStats(),
    mqtt: mqttClient.isConnected(),
  };

  res.json(health);
});
```

---

## Next Steps

1. **Create Gateway Service**
   - New app: `apps/gateway-service`
   - Implement GatewayService class
   - Add Docker image

2. **Complete Protocol Adapters**
   - Finish Modbus implementation
   - Finish OPC UA implementation
   - Add tests

3. **Implement Device Manager**
   - Create DeviceManager service
   - Add lifecycle state machine
   - Implement provisioning

4. **Testing**
   - Unit tests for adapters
   - Integration tests for gateway
   - Load testing

5. **Migration**
   - Gradual migration of existing services
   - Maintain backward compatibility
   - Monitor and optimize

---

## References

- [Eclipse Sparkplug™ Specification](https://sparkplug.eclipse.org/)
- [Modbus Protocol](https://modbus.org/)
- [OPC UA Specification](https://opcfoundation.org/)
- [LoRaWAN Specification](https://lora-alliance.org/)
- [MQTT 5.0 Specification](https://mqtt.org/)

---

**Document Maintainer:** Architecture Team
**Review Cycle:** Quarterly
**Feedback:** Submit issues to architecture review board
