# WebSCADA System Architecture

## System Overview

```mermaid
graph TB
    subgraph "Device Layer"
        GSM[GSM ESP32 Devices<br/>Cellular MQTT]
        LoRa[LoRaWAN Devices<br/>ChirpStack]
        MQTT[Standard MQTT Devices<br/>Sparkplug B]
    end

    subgraph "Gateway Layer"
        GSM_GW[GSM ESP32 Gateway<br/>MQTT Client + TLS]
        LoRa_GW[LoRaWAN Gateway<br/>gRPC Client]
        MQTT_GW[Standard MQTT Gateway<br/>Sparkplug B Parser]
    end

    subgraph "Protocol Layer"
        PC[Protocol Converter<br/>Normalize to Common Format]
        DA[Device Abstraction<br/>Factory Pattern]
    end

    subgraph "Data Pipeline"
        MR[Message Router<br/>Type-based Routing]
        DPL[Data Pipeline<br/>Batch Processing]
        AE[Alarm Engine<br/>Rule Evaluation]
    end

    subgraph "Storage Layer"
        PG[(PostgreSQL<br/>Device State)]
        IDB[(InfluxDB 3.0<br/>Time-Series Data)]
        Redis[(Redis<br/>Cache + Queue)]
    end

    subgraph "API Layer"
        UA[Unified API<br/>REST + WebSocket]
        Auth[Authentication<br/>JWT + RBAC]
    end

    subgraph "Frontend"
        Dashboard[Device Dashboard]
        GSM_UI[GSM Interface]
        LoRa_UI[LoRaWAN Interface]
        MQTT_UI[MQTT Interface]
        Charts[Real-time Charts]
    end

    subgraph "External Services"
        CS[ChirpStack<br/>LoRaWAN Server]
        Mosquitto[Mosquitto MQTT<br/>Broker + TLS]
        OTA[OTA Service<br/>Firmware Updates]
    end

    %% Device to Gateway
    GSM -->|MQTT/TLS| Mosquitto
    LoRa -->|LoRaWAN| CS
    MQTT -->|MQTT| Mosquitto

    %% Gateway to Protocol
    Mosquitto -->|Subscribe| GSM_GW
    CS -->|gRPC| LoRa_GW
    Mosquitto -->|Subscribe| MQTT_GW

    %% Protocol to Pipeline
    GSM_GW --> PC
    LoRa_GW --> PC
    MQTT_GW --> PC
    PC --> DA
    DA --> MR

    %% Pipeline to Storage
    MR --> DPL
    DPL --> IDB
    DPL --> PG
    DPL --> Redis
    MR --> AE
    AE --> PG

    %% API to Storage
    UA --> PG
    UA --> IDB
    UA --> Redis
    Auth --> UA

    %% Frontend to API
    Dashboard --> UA
    GSM_UI --> UA
    LoRa_UI --> UA
    MQTT_UI --> UA
    Charts --> UA

    %% OTA
    OTA --> GSM

    style GSM fill:#e1f5ff
    style LoRa fill:#fff4e1
    style MQTT fill:#e8f5e9
    style IDB fill:#f3e5f5
    style PG fill:#e3f2fd
```

## Component Details

### 1. Device Layer

**GSM ESP32 Devices:**

- Cellular connectivity (2G/3G/4G)
- MQTT over TLS
- JSON payloads (Sparkplug B compatible)
- OTA firmware updates
- Deep sleep power management

**LoRaWAN Devices:**

- Long-range, low-power communication
- ChirpStack managed
- OTAA/ABP activation
- End-to-end encryption
- Payload decoders

**Standard MQTT Devices:**

- Direct MQTT connection
- Sparkplug B protocol
- QoS 0/1/2 support
- Retained messages
- Last will testament

### 2. Gateway Layer

**GSM ESP32 Gateway:**

- MQTT client with auto-reconnect
- TLS 1.2+ encryption
- Offline message buffering
- Device lifecycle management
- Signal strength monitoring

**LoRaWAN Gateway:**

- ChirpStack gRPC integration
- Device provisioning (OTAA/ABP)
- Multi-decoder support
- Uplink/downlink handling
- Gateway status monitoring

**Standard MQTT Gateway:**

- Sparkplug B parser
- Topic-based routing
- Auto-discovery
- QoS management
- Session persistence

### 3. Protocol Layer

**Protocol Converter:**

- Normalizes all 3 device types to unified format
- Handles different payload structures
- Validates data integrity
- Enriches with metadata

**Device Abstraction:**

- Factory pattern for device creation
- Unified interface for all device types
- Dependency injection
- Lifecycle management

### 4. Data Pipeline

**Message Router:**

- Type-based message routing
- Priority queuing
- Load balancing
- Error handling

**Data Pipeline:**

- Batch writes to InfluxDB (10k points/sec)
- State updates to PostgreSQL
- Real-time WebSocket broadcasting
- <100ms latency target

**Alarm Engine:**

- Configurable alarm rules
- Real-time evaluation
- Priority levels
- Notification system

### 5. Storage Layer

**PostgreSQL:**

- Device metadata and configuration
- User accounts and permissions
- Alarm definitions and history
- Device connection logs

**InfluxDB 3.0:**

- Time-series telemetry data
- Device health metrics
- Alarm events
- Analytics aggregations

**Redis:**

- Session storage
- Message queue
- Real-time cache
- Pub/sub for WebSocket

### 6. API Layer

**Unified API:**

- RESTful endpoints
- WebSocket for real-time
- Rate limiting
- Request validation (Zod)

**Authentication:**

- JWT tokens
- Role-based access control (RBAC)
- API key management
- Device authentication

## Data Flow

### Telemetry Data Flow

```mermaid
sequenceDiagram
    participant Device
    participant Gateway
    participant Protocol
    participant Pipeline
    participant Storage
    participant API
    participant Frontend

    Device->>Gateway: Publish Data
    Gateway->>Protocol: Raw Message
    Protocol->>Protocol: Normalize Format
    Protocol->>Pipeline: Unified Message
    Pipeline->>Pipeline: Route by Type
    Pipeline->>Storage: Batch Write
    Pipeline->>API: Real-time Event
    API->>Frontend: WebSocket Push
```

### Command Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant API
    participant Auth
    participant Gateway
    participant Device

    Frontend->>API: Send Command
    API->>Auth: Validate Token
    Auth->>API: Authorized
    API->>Gateway: Route Command
    Gateway->>Device: MQTT/LoRaWAN
    Device->>Gateway: Acknowledgment
    Gateway->>API: Status Update
    API->>Frontend: Command Result
```

## Performance Targets

| Metric                | Target | Current |
| --------------------- | ------ | ------- |
| GSM ESP32 Devices     | 1000+  | -       |
| LoRaWAN Devices       | 5000+  | -       |
| Standard MQTT Devices | 2000+  | -       |
| Pipeline Latency      | <100ms | -       |
| API Response Time     | <500ms | -       |
| Message Delivery      | 99.9%  | -       |
| Tag Support           | 100k+  | -       |
| Real-time Updates     | <1s    | -       |

## Security Architecture

### IEC 62443 Compliance

**Zone Segmentation:**

- Level 0: Device Layer (isolated networks)
- Level 1: Gateway Layer (DMZ)
- Level 2: Application Layer (internal network)
- Level 3: Enterprise Layer (user access)

**Security Controls:**

- TLS 1.2+ for all MQTT connections
- End-to-end LoRaWAN encryption
- JWT authentication with refresh tokens
- RBAC with principle of least privilege
- Device certificate management
- Audit logging (all operations)
- SQL injection prevention (Zod validation)
- XSS protection (Content Security Policy)
- Rate limiting (per device type)
- Intrusion detection

## Scalability

### Horizontal Scaling

- Gateway services: Stateless, scale to N instances
- Data pipeline: Queue-based, parallel processing
- API layer: Load balanced across instances
- InfluxDB: Clustered deployment
- PostgreSQL: Read replicas

### Vertical Scaling

- Batch sizes configurable
- Worker thread pools
- Connection pooling
- Memory-efficient streaming

## Monitoring & Observability

- Prometheus metrics export
- Grafana dashboards
- Device health monitoring
- Gateway status tracking
- Pipeline throughput metrics
- Alarm rate monitoring
- API performance tracking
- Error rate alerts

## Disaster Recovery

- PostgreSQL: Daily backups + WAL archiving
- InfluxDB: Snapshot backups every 6 hours
- Redis: AOF persistence
- Configuration versioning
- Blue-green deployments
- Automated failover
- Data retention policies

## Technology Stack

**Backend:**

- Node.js 20 LTS
- TypeScript 5.3+
- Fastify 4.x
- MQTT.js 5.x
- Sparkplug B protocol
- ChirpStack gRPC client

**Frontend:**

- Next.js 14 (App Router)
- React 18
- TypeScript 5.3+
- Tailwind CSS
- Recharts/D3.js
- Socket.IO client

**Databases:**

- PostgreSQL 16
- InfluxDB 3.0
- Redis 7

**Infrastructure:**

- Docker
- Docker Compose
- Mosquitto MQTT
- ChirpStack LoRaWAN Server

**Firmware:**

- ESP32 (Arduino/ESP-IDF)
- GSM modem libraries
- MQTT client
- TLS support
