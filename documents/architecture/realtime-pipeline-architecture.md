# Real-Time Data Pipeline Architecture

## Sub-100ms Latency Design for Industrial IoT

**Version:** 1.0.0
**Last Updated:** 2025-11-27
**Target:** <100ms end-to-end latency for critical alarms and commands

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Latency Budget Analysis](#latency-budget-analysis)
3. [WebSocket Architecture](#websocket-architecture)
4. [Stream Processing](#stream-processing)
5. [Data Aggregation](#data-aggregation)
6. [Alarm Management](#alarm-management)
7. [Command & Control](#command--control)
8. [Network Resilience](#network-resilience)
9. [Implementation Patterns](#implementation-patterns)
10. [Performance Optimization](#performance-optimization)

---

## 1. Architecture Overview

### 1.1 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVICE LAYER                                 │
│  [Sensors] [PLCs] [RTUs] [ESP32] [LoRaWAN] [GSM]              │
└────────────────────────┬────────────────────────────────────────┘
                         │ MQTT/HTTP/LoRaWAN
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PROTOCOL GATEWAY LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │   MQTT   │  │ LoRaWAN  │  │   HTTP   │                     │
│  │ Gateway  │  │ Gateway  │  │ Gateway  │                     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│       └─────────────┼──────────────┘                           │
│                     ↓ Normalize to Sparkplug B                 │
│       ┌─────────────────────────────┐                          │
│       │   Edge Buffer (SQLite)      │  ← Offline resilience   │
│       └─────────────┬───────────────┘                          │
└─────────────────────┼──────────────────────────────────────────┘
                      ↓ Batched/Streaming
┌─────────────────────┴──────────────────────────────────────────┐
│              MESSAGE BROKER LAYER (Kafka/Redis)                │
│                                                                 │
│  Topics (Kafka) / Channels (Redis Streams):                    │
│  ┌────────────────┬──────────────┬─────────────────┐          │
│  │ telemetry.raw  │ alarms.fire  │ commands.queue  │          │
│  │ (partitioned)  │ (priority)   │ (ordered)       │          │
│  └────────────────┴──────────────┴─────────────────┘          │
└────────────────────┬───────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
┌───────────┐ ┌─────────────┐ ┌──────────────┐
│  Stream   │ │   Alarm     │ │   Command    │
│ Processor │ │   Engine    │ │   Executor   │
│ (Flink/   │ │ (Priority   │ │ (Ordered     │
│  Streams) │ │  Queue)     │ │  Delivery)   │
└─────┬─────┘ └──────┬──────┘ └──────┬───────┘
      ↓              ↓               ↓
┌─────┴──────────────┴───────────────┴────────────────────────┐
│            REALTIME DISTRIBUTION LAYER                       │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │        WebSocket Cluster (Socket.IO)               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │  WS Pod  │  │  WS Pod  │  │  WS Pod  │        │    │
│  │  │  1-5K    │  │  1-5K    │  │  1-5K    │        │    │
│  │  │  clients │  │  clients │  │  clients │        │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘        │    │
│  │       └────────────┬─┴────────────┘               │    │
│  │                    ↓                               │    │
│  │        Redis Pub/Sub (state sync)                 │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌──────────────────────────┴───────────────────────────────────┐
│                   CLIENT LAYER                               │
│  [Web Dashboards] [Mobile Apps] [Control Panels]            │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Critical vs Non-Critical Paths

**Critical Path (Target: <100ms):**

```
Device → Gateway → Kafka → Alarm Engine → WebSocket → Client
         ↓ 10ms   ↓ 5ms   ↓ 20ms         ↓ 30ms       ↓ 20ms
                                Total: 85ms ✓
```

**Non-Critical Path (Target: <1s):**

```
Device → Gateway → Kafka → Stream Processor → TimescaleDB
         ↓ 10ms   ↓ 5ms   ↓ 100ms          ↓ 50ms
         → Aggregation → InfluxDB
           ↓ 200ms      ↓ 50ms
                         Total: 415ms ✓
```

---

## 2. Latency Budget Analysis

### 2.1 End-to-End Latency Breakdown

**Target: <100ms for critical alarms**

| Stage                         | Component      | Latency (P95) | Latency (P99)   | Optimization                  |
| ----------------------------- | -------------- | ------------- | --------------- | ----------------------------- |
| **1. Device to Gateway**      | Network        | 5-10ms        | 10-20ms         | Use MQTT QoS 0, local gateway |
| **2. Protocol Normalization** | Gateway CPU    | 1-3ms         | 3-5ms           | Pre-compiled parsers          |
| **3. Message Broker**         | Kafka/Redis    | 2-5ms         | 5-10ms          | In-memory, local brokers      |
| **4. Alarm Evaluation**       | Rule Engine    | 5-15ms        | 15-30ms         | In-memory rules, indexes      |
| **5. WebSocket Delivery**     | Network + WS   | 10-30ms       | 30-50ms         | Keep-alive, binary protocol   |
| **6. Client Rendering**       | Browser/App    | 5-10ms        | 10-20ms         | Virtual DOM, web workers      |
| **Total**                     | **End-to-End** | **28-73ms** ✓ | **73-135ms** ⚠️ | **Acceptable**                |

**P99 exceeds 100ms → Need optimization strategies**

### 2.2 Latency Optimization Strategies

#### Strategy 1: **Fast Path for Critical Alarms**

```typescript
// Skip Kafka for critical alarms
if (alarm.severity === 'CRITICAL') {
  // Direct Redis Pub/Sub (2-5ms)
  await redis.publish('alarms:critical', JSON.stringify(alarm));
} else {
  // Normal Kafka flow (5-10ms)
  await kafka.send({ topic: 'alarms.fire', messages: [alarm] });
}
```

#### Strategy 2: **Edge Processing**

```
Device → Edge Gateway (local alarm evaluation)
         ↓ 1-5ms
         Local WebSocket broadcast

Parallel:
         ↓ Send to cloud for persistence
         Cloud Kafka → Storage
```

#### Strategy 3: **Pre-Computed Alarm States**

```typescript
// Maintain in-memory alarm state
const alarmStates = new Map<string, AlarmState>();

// Evaluate only on state change (not every message)
if (newState !== currentState) {
  // Fire alarm (5ms)
  fireAlarm(alarm);
} else {
  // Skip evaluation (0ms)
  return;
}
```

#### Strategy 4: **WebSocket Keep-Alive**

```typescript
// Maintain persistent connections
io.on('connection', (socket) => {
  // Send ping every 15 seconds
  const pingInterval = setInterval(() => {
    socket.emit('ping', Date.now());
  }, 15000);

  // Immediate delivery when connection alive
  socket.on('pong', () => {
    // Connection verified, send queued messages
    flushQueuedMessages(socket);
  });
});
```

---

## 3. WebSocket Architecture

### 3.1 Connection Management

#### Scalable WebSocket Cluster

```typescript
// apps/websocket-service/src/index.ts

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Redis Pub/Sub for multi-pod communication
const pubClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

// Create Socket.IO server
const io = new Server(server, {
  // Performance optimizations
  transports: ['websocket'], // Skip polling fallback
  pingTimeout: 20000,
  pingInterval: 15000,

  // Compression
  perMessageDeflate: {
    threshold: 1024, // Only compress messages >1KB
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
});

// Enable Redis adapter for horizontal scaling
io.adapter(createAdapter(pubClient, subClient));

// Namespace for device telemetry
const telemetryNamespace = io.of('/telemetry');

telemetryNamespace.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Authenticate
  const user = await authenticate(socket.handshake.auth.token);
  if (!user) {
    socket.disconnect();
    return;
  }

  // Store user context
  socket.data.userId = user.id;
  socket.data.deviceIds = user.authorizedDevices;

  // Join device rooms
  for (const deviceId of user.authorizedDevices) {
    socket.join(`device:${deviceId}`);
  }

  // Track connection in Redis
  await redis.sadd(`user:${user.id}:sockets`, socket.id);
  await redis.hset(`socket:${socket.id}`, {
    userId: user.id,
    deviceIds: JSON.stringify(user.authorizedDevices),
    connectedAt: Date.now(),
  });

  // Handle reconnection (resume from last known state)
  socket.on('resume', async (lastSeq) => {
    // Send missed messages since lastSeq
    const missed = await getMessagesSince(user.authorizedDevices, lastSeq);
    socket.emit('catch-up', missed);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    await redis.srem(`user:${user.id}:sockets`, socket.id);
    await redis.del(`socket:${socket.id}`);
  });

  // Send initial state
  const initialState = await getDeviceStates(user.authorizedDevices);
  socket.emit('initial-state', initialState);
});
```

#### Connection Pooling Strategy

```typescript
// Maximum connections per pod
const MAX_CONNECTIONS_PER_POD = 5000;

// Connection limiting middleware
io.use(async (socket, next) => {
  const connectionCount = await io.of('/telemetry').sockets.size;

  if (connectionCount >= MAX_CONNECTIONS_PER_POD) {
    next(new Error('Server at capacity'));
  } else {
    next();
  }
});

// Horizontal Pod Autoscaler (Kubernetes)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: websocket-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: websocket-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Pods
    pods:
      metric:
        name: websocket_connections
      target:
        type: AverageValue
        averageValue: "4000"  # Scale at 80% capacity
```

### 3.2 Reconnection Strategy

#### Client-Side Exponential Backoff

```typescript
// frontend/src/lib/websocket.ts

class WebSocketClient {
  private socket: Socket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private lastSeq = 0; // Last received message sequence

  connect() {
    this.socket = io('ws://api.example.com/telemetry', {
      auth: {
        token: getAuthToken(),
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: this.maxReconnectAttempts,
      // Exponential backoff
      reconnectionDelayMax: (attempt) => {
        return Math.min(1000 * Math.pow(2, attempt), 30000);
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.reconnectAttempts = 0;

      // Resume from last known state
      if (this.lastSeq > 0) {
        this.socket.emit('resume', this.lastSeq);
      }
    });

    this.socket.on('telemetry', (data) => {
      // Update sequence number
      this.lastSeq = data.seq;

      // Process telemetry
      this.handleTelemetry(data);
    });

    this.socket.on('catch-up', (messages) => {
      // Process missed messages in order
      messages.sort((a, b) => a.seq - b.seq);
      messages.forEach((msg) => {
        this.handleTelemetry(msg);
        this.lastSeq = msg.seq;
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Disconnected:', reason);

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, manual reconnect
        this.socket.connect();
      }
      // Auto-reconnection for other reasons
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error(`Connection error (attempt ${this.reconnectAttempts}):`, error);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // Fallback to HTTP polling
        this.fallbackToPolling();
      }
    });
  }

  private fallbackToPolling() {
    console.log('Falling back to HTTP polling');

    // Poll every 5 seconds
    setInterval(async () => {
      try {
        const data = await fetch('/api/devices/telemetry/latest', {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const telemetry = await data.json();
        telemetry.forEach((t) => this.handleTelemetry(t));
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
  }
}
```

### 3.3 Message Ordering Guarantees

#### Sequence Numbering

```typescript
// Message sequence tracking
interface TelemetryMessage {
  seq: number; // Global sequence number
  deviceId: string;
  timestamp: number;
  data: any;
}

// Server-side sequence generation
class MessageSequencer {
  private sequences = new Map<string, number>(); // Per device

  async getNextSeq(deviceId: string): Promise<number> {
    // Use Redis INCR for distributed sequence
    return await redis.incr(`seq:device:${deviceId}`);
  }
}

// Client-side ordering buffer
class OrderedMessageBuffer {
  private buffer = new Map<string, TelemetryMessage[]>();
  private expectedSeq = new Map<string, number>();

  add(message: TelemetryMessage) {
    const deviceId = message.deviceId;
    const expected = this.expectedSeq.get(deviceId) || 0;

    if (message.seq === expected) {
      // In order, process immediately
      this.process(message);
      this.expectedSeq.set(deviceId, expected + 1);

      // Check buffer for next messages
      this.flushBuffer(deviceId);
    } else if (message.seq > expected) {
      // Out of order, buffer it
      if (!this.buffer.has(deviceId)) {
        this.buffer.set(deviceId, []);
      }
      this.buffer.get(deviceId)!.push(message);

      // Request missing messages
      this.requestMissing(deviceId, expected, message.seq);
    } else {
      // Duplicate or late arrival, ignore
      console.warn(`Duplicate message: ${message.seq}`);
    }
  }

  private flushBuffer(deviceId: string) {
    const buffered = this.buffer.get(deviceId) || [];
    const expected = this.expectedSeq.get(deviceId)!;

    // Sort and process in-order messages
    buffered.sort((a, b) => a.seq - b.seq);

    let processed = 0;
    for (const msg of buffered) {
      if (msg.seq === expected + processed) {
        this.process(msg);
        processed++;
      } else {
        break; // Gap in sequence
      }
    }

    if (processed > 0) {
      this.buffer.set(deviceId, buffered.slice(processed));
      this.expectedSeq.set(deviceId, expected + processed);
    }
  }

  private requestMissing(deviceId: string, from: number, to: number) {
    socket.emit('request-missing', { deviceId, from, to });
  }
}
```

---

## 4. Stream Processing

### 4.1 Apache Flink vs Kafka Streams Comparison

| Feature              | Apache Flink                         | Kafka Streams              | Recommendation              |
| -------------------- | ------------------------------------ | -------------------------- | --------------------------- |
| **Latency**          | 5-20ms                               | 10-50ms                    | **Flink for <10ms**         |
| **Throughput**       | Millions/sec                         | Hundreds of thousands/sec  | **Flink for high volume**   |
| **State Management** | Distributed, fault-tolerant          | Local, backed by Kafka     | **Flink for complex state** |
| **Windowing**        | Event time, processing time, session | Tumbling, hopping, session | **Flink more flexible**     |
| **Deployment**       | Separate cluster                     | Embedded in app            | **Kafka Streams simpler**   |
| **Scalability**      | Excellent (TaskManagers)             | Good (Kafka partitions)    | **Flink for 10K+ devices**  |
| **Language**         | Java, Scala, Python                  | Java, Scala                | Tie                         |
| **Learning Curve**   | Steep                                | Moderate                   | **Kafka Streams easier**    |
| **Operations**       | Complex (Flink cluster)              | Simple (just Kafka)        | **Kafka Streams easier**    |

**Recommendation for WebSCADA:**

- **Use Apache Flink** for:
  - Real-time aggregations (1-second windows)
  - Complex event processing (CEP)
  - Alarm correlation and pattern detection
  - ML inference on streaming data

- **Use Kafka Streams** for:
  - Simple transformations
  - Data enrichment
  - Filtering and routing
  - When latency <50ms is acceptable

### 4.2 Apache Flink Implementation

#### Stream Processing Job

```java
// flink-jobs/src/main/java/com/webscada/TelemetryAggregationJob.java

public class TelemetryAggregationJob {
  public static void main(String[] args) throws Exception {
    StreamExecutionEnvironment env =
      StreamExecutionEnvironment.getExecutionEnvironment();

    // Configure for low latency
    env.setBufferTimeout(10);  // 10ms buffer timeout
    env.enableCheckpointing(60000);  // Checkpoint every minute
    env.getCheckpointConfig().setCheckpointingMode(
      CheckpointingMode.AT_LEAST_ONCE  // For low latency
    );

    // Kafka source
    KafkaSource<TelemetryEvent> source = KafkaSource.<TelemetryEvent>builder()
      .setBootstrapServers("kafka:9092")
      .setTopics("device.telemetry.raw")
      .setGroupId("flink-aggregator")
      .setStartingOffsets(OffsetsInitializer.latest())
      .setValueOnlyDeserializer(new TelemetryDeserializer())
      .build();

    DataStream<TelemetryEvent> telemetry = env
      .fromSource(source, WatermarkStrategy.noWatermarks(), "Kafka Source");

    // Windowed aggregation (1-second tumbling windows)
    DataStream<AggregatedMetrics> aggregated = telemetry
      .keyBy(event -> event.getDeviceId())
      .window(TumblingEventTimeWindows.of(Time.seconds(1)))
      .aggregate(new MetricAggregator());

    // Sink to TimescaleDB
    aggregated.addSink(new TimescaleDBSink());

    // Parallel stream for alarm detection
    DataStream<Alarm> alarms = telemetry
      .keyBy(event -> event.getDeviceId())
      .flatMap(new AlarmDetector())  // Stateful function
      .filter(alarm -> alarm != null);

    // Sink alarms to Redis (fast path)
    alarms
      .filter(alarm -> alarm.getSeverity() == Severity.CRITICAL)
      .addSink(new RedisSink("alarms:critical"));

    // Sink all alarms to Kafka
    alarms.sinkTo(KafkaSink.<Alarm>builder()
      .setBootstrapServers("kafka:9092")
      .setRecordSerializer(new AlarmSerializer())
      .setDeliverGuarantee(DeliveryGuarantee.AT_LEAST_ONCE)
      .build());

    env.execute("Telemetry Aggregation Job");
  }
}

// Stateful alarm detector
class AlarmDetector extends RichFlatMapFunction<TelemetryEvent, Alarm> {
  private ValueState<AlarmState> alarmState;

  @Override
  public void open(Configuration config) {
    ValueStateDescriptor<AlarmState> descriptor =
      new ValueStateDescriptor<>("alarm-state", AlarmState.class);
    alarmState = getRuntimeContext().getState(descriptor);
  }

  @Override
  public void flatMap(TelemetryEvent event, Collector<Alarm> out) throws Exception {
    AlarmState current = alarmState.value();

    // Evaluate alarm rules
    boolean isAlarming = evaluateRules(event);

    // State transition
    if (isAlarming && (current == null || !current.isAlarming())) {
      // Alarm triggered
      Alarm alarm = new Alarm(
        event.getDeviceId(),
        event.getMetricName(),
        event.getValue(),
        Severity.fromValue(event.getValue()),
        System.currentTimeMillis()
      );

      alarmState.update(new AlarmState(true, alarm));
      out.collect(alarm);
    } else if (!isAlarming && current != null && current.isAlarming()) {
      // Alarm cleared
      Alarm cleared = current.getAlarm().clear();
      alarmState.update(new AlarmState(false, null));
      out.collect(cleared);
    }
  }

  private boolean evaluateRules(TelemetryEvent event) {
    // Load rules from state or config
    // Evaluate thresholds, patterns, etc.
    return event.getValue() > 100;  // Example
  }
}
```

### 4.3 Kafka Streams Alternative

```typescript
// apps/stream-processor/src/kafka-streams.ts

import { Kafka, logLevel } from 'kafkajs';
import { Redis } from 'ioredis';

const kafka = new Kafka({
  clientId: 'stream-processor',
  brokers: ['kafka:9092'],
  logLevel: logLevel.ERROR,
});

const consumer = kafka.consumer({
  groupId: 'telemetry-aggregator',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const redis = new Redis(process.env.REDIS_URL);

// State store (in-memory with Redis backup)
const windowStates = new Map<string, WindowState>();

interface WindowState {
  deviceId: string;
  metricName: string;
  values: number[];
  windowStart: number;
  windowEnd: number;
}

async function processTelemetry() {
  await consumer.connect();
  await consumer.subscribe({
    topic: 'device.telemetry.raw',
    fromBeginning: false,
  });

  await consumer.run({
    autoCommit: true,
    autoCommitInterval: 5000,

    eachMessage: async ({ topic, partition, message }) => {
      const telemetry = JSON.parse(message.value.toString());

      // Tumbling window (1 second)
      const windowKey = `${telemetry.deviceId}:${telemetry.metricName}:${
        Math.floor(telemetry.timestamp / 1000) * 1000
      }`;

      let window = windowStates.get(windowKey);
      if (!window) {
        window = {
          deviceId: telemetry.deviceId,
          metricName: telemetry.metricName,
          values: [],
          windowStart: Math.floor(telemetry.timestamp / 1000) * 1000,
          windowEnd: Math.floor(telemetry.timestamp / 1000) * 1000 + 1000,
        };
        windowStates.set(windowKey, window);

        // Schedule window closure
        setTimeout(() => {
          closeWindow(windowKey);
        }, 1000);
      }

      window.values.push(telemetry.value);

      // Alarm detection (stateful)
      await detectAlarm(telemetry);
    },
  });
}

async function closeWindow(windowKey: string) {
  const window = windowStates.get(windowKey);
  if (!window) return;

  // Compute aggregates
  const aggregated = {
    deviceId: window.deviceId,
    metricName: window.metricName,
    avg: window.values.reduce((a, b) => a + b, 0) / window.values.length,
    min: Math.min(...window.values),
    max: Math.max(...window.values),
    count: window.values.length,
    windowStart: window.windowStart,
    windowEnd: window.windowEnd,
  };

  // Write to TimescaleDB (batched)
  await writeAggregated(aggregated);

  // Remove from state
  windowStates.delete(windowKey);
}

// Stateful alarm detection
const alarmStates = new Map<string, AlarmState>();

async function detectAlarm(telemetry: any) {
  const key = `${telemetry.deviceId}:${telemetry.metricName}`;
  const currentState = alarmStates.get(key);

  const isAlarming = telemetry.value > 100; // Example rule

  if (isAlarming && (!currentState || !currentState.isAlarming)) {
    // Alarm triggered
    const alarm = {
      deviceId: telemetry.deviceId,
      metricName: telemetry.metricName,
      value: telemetry.value,
      severity: 'CRITICAL',
      timestamp: Date.now(),
    };

    // Fast path: Direct Redis publish
    await redis.publish('alarms:critical', JSON.stringify(alarm));

    alarmStates.set(key, { isAlarming: true, alarm });
  } else if (!isAlarming && currentState && currentState.isAlarming) {
    // Alarm cleared
    await redis.publish(
      'alarms:cleared',
      JSON.stringify({
        ...currentState.alarm,
        clearedAt: Date.now(),
      })
    );

    alarmStates.set(key, { isAlarming: false, alarm: null });
  }
}

processTelemetry().catch(console.error);
```

---

## 5. Data Aggregation

### 5.1 Windowing Functions

#### Time-Based Windows

```typescript
// 1-second tumbling window
class TumblingWindow {
  private windows = new Map<string, Window>();

  add(deviceId: string, metric: string, value: number, timestamp: number) {
    // Round down to nearest second
    const windowStart = Math.floor(timestamp / 1000) * 1000;
    const key = `${deviceId}:${metric}:${windowStart}`;

    let window = this.windows.get(key);
    if (!window) {
      window = new Window(deviceId, metric, windowStart, windowStart + 1000);
      this.windows.set(key, window);

      // Auto-close window after 1 second + grace period
      setTimeout(() => this.closeWindow(key), 1100);
    }

    window.add(value);
  }

  private closeWindow(key: string) {
    const window = this.windows.get(key);
    if (window) {
      const result = window.compute();
      this.emit('window-closed', result);
      this.windows.delete(key);
    }
  }
}

class Window {
  private values: number[] = [];

  constructor(
    public deviceId: string,
    public metric: string,
    public start: number,
    public end: number
  ) {}

  add(value: number) {
    this.values.push(value);
  }

  compute() {
    return {
      deviceId: this.deviceId,
      metric: this.metric,
      avg: this.values.reduce((a, b) => a + b, 0) / this.values.length,
      min: Math.min(...this.values),
      max: Math.max(...this.values),
      sum: this.values.reduce((a, b) => a + b, 0),
      count: this.values.length,
      start: this.start,
      end: this.end,
    };
  }
}
```

#### Sliding Window

```typescript
// 5-minute sliding window with 1-minute slide
class SlidingWindow {
  private buffer: Array<{ timestamp: number; value: number }> = [];
  private readonly windowSize = 5 * 60 * 1000; // 5 minutes
  private readonly slideInterval = 60 * 1000; // 1 minute

  add(value: number, timestamp: number) {
    // Add to buffer
    this.buffer.push({ timestamp, value });

    // Remove old values (older than 5 minutes)
    const cutoff = timestamp - this.windowSize;
    this.buffer = this.buffer.filter((v) => v.timestamp >= cutoff);

    // Trigger computation every minute
    if (this.shouldCompute(timestamp)) {
      return this.compute(timestamp);
    }
  }

  private shouldCompute(timestamp: number): boolean {
    // Compute every slide interval
    return timestamp % this.slideInterval === 0;
  }

  private compute(timestamp: number) {
    const values = this.buffer.map((v) => v.value);

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      timestamp,
      windowSize: this.windowSize,
    };
  }
}
```

### 5.2 Downsampling Strategies

#### Multi-Tier Resolution

```typescript
interface DownsamplingTier {
  resolution: string;
  retention: string;
  aggregation: 'avg' | 'min' | 'max' | 'sum';
}

const DOWNSAMPLING_TIERS: DownsamplingTier[] = [
  // Raw data: 1 sample/second, keep 7 days
  { resolution: '1s', retention: '7d', aggregation: 'avg' },

  // Tier 1: 1 minute aggregates, keep 30 days
  { resolution: '1m', retention: '30d', aggregation: 'avg' },

  // Tier 2: 1 hour aggregates, keep 1 year
  { resolution: '1h', retention: '365d', aggregation: 'avg' },

  // Tier 3: 1 day aggregates, keep forever
  { resolution: '1d', retention: 'inf', aggregation: 'avg' }
];

// TimescaleDB continuous aggregates
CREATE MATERIALIZED VIEW telemetry_1min
WITH (timescaledb.continuous) AS
SELECT
  device_id,
  metric_name,
  time_bucket('1 minute', timestamp) AS bucket,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as sample_count
FROM device_telemetry
GROUP BY device_id, metric_name, bucket;

-- Refresh policy
SELECT add_continuous_aggregate_policy('telemetry_1min',
  start_offset => INTERVAL '2 minutes',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute'
);

-- Retention policy for raw data
SELECT add_retention_policy('device_telemetry', INTERVAL '7 days');
```

#### Adaptive Downsampling

```typescript
// Send full resolution for critical changes, downsampled for stable values
class AdaptiveDownsampler {
  private lastSent = new Map<string, number>();
  private deadband = 0.1; // 10% change threshold

  shouldSend(deviceId: string, metric: string, value: number): boolean {
    const key = `${deviceId}:${metric}`;
    const last = this.lastSent.get(key);

    if (last === undefined) {
      // First sample, always send
      this.lastSent.set(key, value);
      return true;
    }

    // Calculate percentage change
    const change = Math.abs((value - last) / last);

    if (change > this.deadband) {
      // Significant change, send full resolution
      this.lastSent.set(key, value);
      return true;
    }

    // Minimal change, skip (or send downsampled)
    return false;
  }
}
```

---

## 6. Alarm Management

### 6.1 Priority Queueing

```typescript
// Priority queue for alarm processing
import { PriorityQueue } from '@datastructures-js/priority-queue';

enum AlarmPriority {
  CRITICAL = 0, // Highest
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
  INFO = 4, // Lowest
}

interface Alarm {
  id: string;
  deviceId: string;
  message: string;
  severity: AlarmPriority;
  timestamp: number;
  acknowledged: boolean;
}

class AlarmQueue {
  private queue = new PriorityQueue<Alarm>((a, b) => {
    // Primary sort: severity (lower number = higher priority)
    if (a.severity !== b.severity) {
      return a.severity - b.severity;
    }
    // Secondary sort: timestamp (older first)
    return a.timestamp - b.timestamp;
  });

  enqueue(alarm: Alarm) {
    this.queue.enqueue(alarm);

    // Immediate processing for critical alarms
    if (alarm.severity === AlarmPriority.CRITICAL) {
      this.processCritical(alarm);
    }
  }

  dequeue(): Alarm | undefined {
    return this.queue.dequeue();
  }

  private async processCritical(alarm: Alarm) {
    // Fast path: Direct Redis publish
    await redis.publish('alarms:critical', JSON.stringify(alarm));

    // Immediate notification
    await notificationService.sendImmediate(alarm);

    // Log to database (async, non-blocking)
    setImmediate(() => {
      db.insertAlarm(alarm);
    });
  }
}
```

### 6.2 De-Duplication

```typescript
// Prevent alarm flooding
class AlarmDeduplicator {
  private recentAlarms = new Map<string, AlarmHistory>();
  private dedupeWindow = 60000; // 1 minute

  shouldFire(alarm: Alarm): boolean {
    const key = `${alarm.deviceId}:${alarm.message}`;
    const history = this.recentAlarms.get(key);

    const now = Date.now();

    if (!history) {
      // First occurrence
      this.recentAlarms.set(key, {
        firstSeen: now,
        lastSeen: now,
        count: 1,
      });
      return true;
    }

    // Check if within deduplication window
    if (now - history.lastSeen < this.dedupeWindow) {
      // Duplicate, suppress but update count
      history.count++;
      history.lastSeen = now;
      return false;
    }

    // Outside window, fire again
    this.recentAlarms.set(key, {
      firstSeen: now,
      lastSeen: now,
      count: 1,
    });
    return true;
  }

  // Periodic cleanup of old entries
  cleanup() {
    const cutoff = Date.now() - this.dedupeWindow;
    for (const [key, history] of this.recentAlarms) {
      if (history.lastSeen < cutoff) {
        this.recentAlarms.delete(key);
      }
    }
  }
}
```

### 6.3 Escalation Workflows

```typescript
interface EscalationRule {
  alarmPattern: string;
  levels: EscalationLevel[];
}

interface EscalationLevel {
  delay: number; // milliseconds
  recipients: string[];
  method: 'email' | 'sms' | 'phone' | 'webhook';
}

class AlarmEscalationEngine {
  private escalations = new Map<string, NodeJS.Timeout[]>();

  async startEscalation(alarm: Alarm, rule: EscalationRule) {
    const key = alarm.id;
    const timers: NodeJS.Timeout[] = [];

    // Schedule escalation levels
    for (const level of rule.levels) {
      const timer = setTimeout(async () => {
        // Check if alarm still active and not acknowledged
        const current = await db.getAlarm(alarm.id);
        if (current && !current.acknowledged) {
          await this.notify(level, alarm);
        }
      }, level.delay);

      timers.push(timer);
    }

    this.escalations.set(key, timers);
  }

  async acknowledge(alarmId: string) {
    // Cancel pending escalations
    const timers = this.escalations.get(alarmId);
    if (timers) {
      timers.forEach((timer) => clearTimeout(timer));
      this.escalations.delete(alarmId);
    }

    // Update database
    await db.acknowledgeAlarm(alarmId);
  }

  private async notify(level: EscalationLevel, alarm: Alarm) {
    switch (level.method) {
      case 'email':
        await emailService.send(level.recipients, alarm);
        break;
      case 'sms':
        await smsService.send(level.recipients, alarm);
        break;
      case 'phone':
        await voiceService.call(level.recipients, alarm);
        break;
      case 'webhook':
        await webhookService.trigger(level.recipients, alarm);
        break;
    }
  }
}

// Example escalation rule
const criticalAlarmRule: EscalationRule = {
  alarmPattern: 'CRITICAL:*',
  levels: [
    {
      delay: 0, // Immediate
      recipients: ['operator@example.com'],
      method: 'email',
    },
    {
      delay: 300000, // 5 minutes
      recipients: ['supervisor@example.com'],
      method: 'email',
    },
    {
      delay: 900000, // 15 minutes
      recipients: ['+1234567890'],
      method: 'sms',
    },
    {
      delay: 1800000, // 30 minutes
      recipients: ['+1234567890'],
      method: 'phone',
    },
  ],
};
```

---

## 7. Command & Control

### 7.1 Two-Way Communication Pattern

```typescript
// Command request/response pattern
interface Command {
  id: string;
  deviceId: string;
  type: 'read' | 'write' | 'execute';
  payload: any;
  timeout: number;
  priority: number;
}

interface CommandResponse {
  commandId: string;
  deviceId: string;
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}

class CommandExecutor {
  private pendingCommands = new Map<string, PendingCommand>();

  async execute(command: Command): Promise<CommandResponse> {
    // Generate unique command ID
    const commandId = uuid();

    // Create promise for response
    const promise = new Promise<CommandResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Timeout
        this.pendingCommands.delete(commandId);
        reject(new Error(`Command timeout: ${commandId}`));
      }, command.timeout);

      this.pendingCommands.set(commandId, {
        command,
        resolve,
        reject,
        timer,
        sentAt: Date.now(),
      });
    });

    // Send command via MQTT
    const topic = `devices/${command.deviceId}/commands`;
    await mqtt.publish(
      topic,
      JSON.stringify({
        ...command,
        id: commandId,
      }),
      {
        qos: 1, // At least once delivery
        retain: false,
      }
    );

    // Wait for response
    return promise;
  }

  handleResponse(response: CommandResponse) {
    const pending = this.pendingCommands.get(response.commandId);
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve(response);
      this.pendingCommands.delete(response.commandId);
    }
  }
}

// MQTT command topic structure
// Downlink (cloud → device): devices/{deviceId}/commands
// Uplink (device → cloud): devices/{deviceId}/commands/response
```

### 7.2 Command Acknowledgment

```typescript
// Three-phase acknowledgment
enum AckPhase {
  RECEIVED = 'received', // Device received command
  EXECUTING = 'executing', // Device is executing
  COMPLETED = 'completed', // Execution finished
}

interface CommandAck {
  commandId: string;
  phase: AckPhase;
  timestamp: number;
  progress?: number; // 0-100
}

class CommandTracker {
  async sendCommand(command: Command): Promise<void> {
    const commandId = uuid();

    // Store command state
    await redis.hset(`command:${commandId}`, {
      deviceId: command.deviceId,
      payload: JSON.stringify(command.payload),
      status: 'pending',
      createdAt: Date.now(),
    });

    // Publish command
    await kafka.send({
      topic: 'commands.queue',
      messages: [
        {
          key: command.deviceId,
          value: JSON.stringify({ ...command, id: commandId }),
        },
      ],
    });

    // Track delivery
    this.waitForAcknowledgment(commandId);
  }

  private async waitForAcknowledgment(commandId: string) {
    // Subscribe to acknowledgments
    const subscription = kafka.subscribe({
      topic: 'commands.ack',
      groupId: 'command-tracker',
    });

    await kafka.run({
      eachMessage: async ({ message }) => {
        const ack: CommandAck = JSON.parse(message.value.toString());

        if (ack.commandId === commandId) {
          await this.handleAck(commandId, ack);
        }
      },
    });
  }

  private async handleAck(commandId: string, ack: CommandAck) {
    // Update state
    await redis.hset(`command:${commandId}`, {
      status: ack.phase,
      lastAck: Date.now(),
      progress: ack.progress || 0,
    });

    // Notify frontend via WebSocket
    io.to(`command:${commandId}`).emit('command-ack', ack);

    // If completed, cleanup
    if (ack.phase === AckPhase.COMPLETED) {
      setTimeout(() => {
        redis.del(`command:${commandId}`);
      }, 300000); // Keep for 5 minutes
    }
  }
}
```

### 7.3 Command Queuing

```typescript
// Per-device command queue with rate limiting
class DeviceCommandQueue {
  private queues = new Map<string, Queue<Command>>();
  private executing = new Set<string>();
  private rateLimits = new Map<string, RateLimit>();

  async enqueue(command: Command): Promise<void> {
    const deviceId = command.deviceId;

    // Check rate limit
    if (this.isRateLimited(deviceId)) {
      throw new Error('Rate limit exceeded');
    }

    // Get or create queue for device
    let queue = this.queues.get(deviceId);
    if (!queue) {
      queue = new Queue<Command>();
      this.queues.set(deviceId, queue);
    }

    // Add to queue (priority order)
    queue.enqueue(command, command.priority);

    // Process if not already executing
    if (!this.executing.has(deviceId)) {
      this.processQueue(deviceId);
    }
  }

  private async processQueue(deviceId: string) {
    const queue = this.queues.get(deviceId);
    if (!queue || queue.isEmpty()) {
      return;
    }

    this.executing.add(deviceId);

    try {
      const command = queue.dequeue();
      await this.executeCommand(command);

      // Update rate limit
      this.updateRateLimit(deviceId);

      // Process next command
      setTimeout(() => {
        this.executing.delete(deviceId);
        this.processQueue(deviceId);
      }, 100); // 100ms delay between commands
    } catch (error) {
      console.error(`Command execution failed:`, error);
      this.executing.delete(deviceId);
    }
  }

  private isRateLimited(deviceId: string): boolean {
    const limit = this.rateLimits.get(deviceId);
    if (!limit) return false;

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Count commands in last minute
    const count = limit.timestamps.filter((t) => t > windowStart).length;

    return count >= 10; // Max 10 commands per minute
  }

  private updateRateLimit(deviceId: string) {
    let limit = this.rateLimits.get(deviceId);
    if (!limit) {
      limit = { timestamps: [] };
      this.rateLimits.set(deviceId, limit);
    }

    limit.timestamps.push(Date.now());

    // Cleanup old timestamps
    const windowStart = Date.now() - 60000;
    limit.timestamps = limit.timestamps.filter((t) => t > windowStart);
  }
}
```

---

**(Continued in next part due to length...)**

Would you like me to continue with:

- Section 8: Network Resilience (CRDT, offline buffering, delta sync)
- Section 9: Implementation Patterns (code examples)
- Section 10: Performance Optimization (benchmarks, profiling)

Or would you prefer I focus on a specific aspect like:

- Complete CRDT implementation for conflict-free sync
- Offline-first architecture with service workers
- Delta synchronization algorithm
- Complete working example of the real-time pipeline

Let me know what's most valuable!
