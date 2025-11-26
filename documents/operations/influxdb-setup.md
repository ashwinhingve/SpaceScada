# InfluxDB 3.0 Configuration for WebSCADA

## Bucket Structure

### 1. **telemetry** (Main time-series data)

- **Retention**: 90 days
- **Shard Duration**: 7 days
- **Purpose**: Device sensor readings and measurements

**Measurements:**

```
- device_telemetry
  - Tags: device_id, device_type, tag_name, unit
  - Fields: value (float), quality (string)

- gsm_signal
  - Tags: device_id, imei, operator
  - Fields: rssi, signal_quality, network_type

- lorawan_link
  - Tags: device_id, dev_eui, gateway_id
  - Fields: rssi, snr, spreading_factor, frequency

- mqtt_connection
  - Tags: device_id, client_id, broker
  - Fields: connected (boolean), latency_ms
```

### 2. **device_health** (Device status metrics)

- **Retention**: 30 days
- **Shard Duration**: 1 day
- **Purpose**: Device health and performance metrics

**Measurements:**

```
- gsm_health
  - Tags: device_id, imei
  - Fields: battery_voltage, battery_percentage, uptime_seconds, free_heap

- lorawan_health
  - Tags: device_id, dev_eui
  - Fields: battery, uplink_count, downlink_count, error_rate

- gateway_health
  - Tags: gateway_id, gateway_type
  - Fields: messages_processed, error_count, cpu_usage, memory_usage
```

### 3. **alarms** (Alarm events)

- **Retention**: 365 days
- **Shard Duration**: 30 days
- **Purpose**: Historical alarm data

**Measurements:**

```
- alarm_events
  - Tags: device_id, severity, alarm_type
  - Fields: active (boolean), value, threshold, message (string)

- alarm_transitions
  - Tags: alarm_id, device_id
  - Fields: from_state, to_state, acknowledged_by
```

### 4. **analytics** (Aggregated data)

- **Retention**: 730 days (2 years)
- **Shard Duration**: 30 days
- **Purpose**: Pre-aggregated analytics

**Measurements:**

```
- hourly_averages
  - Tags: device_id, tag_name
  - Fields: avg, min, max, count

- daily_statistics
  - Tags: device_id, device_type
  - Fields: total_messages, uptime_percentage, error_count
```

## Setup Commands

```bash
# Create organization
influx org create -n webscada

# Create buckets
influx bucket create \
  --name telemetry \
  --org webscada \
  --retention 90d \
  --shard-group-duration 7d

influx bucket create \
  --name device_health \
  --org webscada \
  --retention 30d \
  --shard-group-duration 1d

influx bucket create \
  --name alarms \
  --org webscada \
  --retention 365d \
  --shard-group-duration 30d

influx bucket create \
  --name analytics \
  --org webscada \
  --retention 730d \
  --shard-group-duration 30d

# Create API token
influx auth create \
  --org webscada \
  --description "WebSCADA API Token" \
  --read-bucket telemetry \
  --read-bucket device_health \
  --read-bucket alarms \
  --read-bucket analytics \
  --write-bucket telemetry \
  --write-bucket device_health \
  --write-bucket alarms
```

## Continuous Queries (Flux Tasks)

### Hourly Aggregation Task

```flux
option task = {
  name: "hourly_aggregation",
  every: 1h,
}

from(bucket: "telemetry")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "device_telemetry")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
  |> set(key: "_measurement", value: "hourly_averages")
  |> to(bucket: "analytics", org: "webscada")
```

### Daily Statistics Task

```flux
option task = {
  name: "daily_statistics",
  every: 1d,
  offset: 1h,
}

from(bucket: "device_health")
  |> range(start: -1d)
  |> filter(fn: (r) => r._measurement == "gateway_health")
  |> group(columns: ["device_id"])
  |> sum(column: "messages_processed")
  |> set(key: "_measurement", value: "daily_statistics")
  |> to(bucket: "analytics", org: "webscada")
```

### Downsampling Old Data

```flux
option task = {
  name: "downsample_old_telemetry",
  every: 1d,
}

from(bucket: "telemetry")
  |> range(start: -30d, stop: -7d)
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> to(bucket: "telemetry_downsampled", org: "webscada")
```

## Performance Optimization

### Write Performance

- **Batch size**: 5000 points
- **Flush interval**: 1 second
- **Parallel writes**: 4 workers
- **Target throughput**: 10,000 points/second

### Query Performance

- Use appropriate time ranges
- Filter by tags before fields
- Limit result sets
- Use downsampled data for historical queries

### Cardinality Management

```flux
// Monitor tag cardinality
import "influxdata/influxdb"

influxdb.cardinality(
  bucket: "telemetry",
  start: -7d,
  predicate: (r) => true
)
```

## Data Model Best Practices

### Tags (Indexed)

- device_id (UUID)
- device_type (GSM_ESP32 | LORAWAN | STANDARD_MQTT)
- tag_name (sensor name)
- unit (measurement unit)
- location (site/zone)

### Fields (Not indexed)

- value (measurement value)
- quality (good | bad | uncertain)
- raw_value (before scaling)

### Example Write

```json
{
  "measurement": "device_telemetry",
  "tags": {
    "device_id": "550e8400-e29b-41d4-a716-446655440000",
    "device_type": "GSM_ESP32",
    "tag_name": "temperature",
    "unit": "celsius"
  },
  "fields": {
    "value": 25.6,
    "quality": "good"
  },
  "timestamp": 1699564800000000000
}
```

## Retention Policies

| Bucket                | Retention | Downsampling   |
| --------------------- | --------- | -------------- |
| telemetry             | 90 days   | Raw data       |
| device_health         | 30 days   | Raw data       |
| alarms                | 365 days  | Raw data       |
| analytics             | 730 days  | Pre-aggregated |
| telemetry_downsampled | 365 days  | 5-minute avg   |

## Backup Strategy

### Daily Backups

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
influx backup /backups/influxdb_$DATE \
  --host http://localhost:8086 \
  --token $INFLUX_TOKEN \
  --org webscada
```

### Restore

```bash
influx restore /backups/influxdb_20240101 \
  --host http://localhost:8086 \
  --token $INFLUX_TOKEN \
  --org webscada \
  --full
```

## Monitoring Queries

### Device Activity

```flux
from(bucket: "telemetry")
  |> range(start: -1h)
  |> group(columns: ["device_id"])
  |> count()
  |> filter(fn: (r) => r._value > 0)
```

### System Health

```flux
from(bucket: "device_health")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "gateway_health")
  |> last()
```

### Alarm Summary

```flux
from(bucket: "alarms")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "alarm_events")
  |> filter(fn: (r) => r.active == true)
  |> group(columns: ["severity"])
  |> count()
```
