# Docker Infrastructure

This directory contains all Dockerfiles and configuration files for the WebSCADA production deployment.

## Directory Structure

```
infrastructure/
├── docker/                    # Dockerfiles (in apps/ and services/)
├── mosquitto/                 # MQTT broker configuration
│   ├── mosquitto.conf        # Main configuration
│   ├── passwd                # Password file (generate in production)
│   └── certs/                # TLS certificates (generate in production)
├── chirpstack/               # LoRaWAN server configuration
│   └── chirpstack.toml       # Main configuration
├── monitoring/               # Monitoring configuration
│   ├── prometheus.yml        # Prometheus scrape configs
│   └── grafana/              # Grafana dashboards and datasources
└── k8s/                      # Kubernetes manifests
```

## Services and Dockerfiles

### Backend Services

- **unified-api**: `apps/unified-api/Dockerfile` - Main API server (port 3001)
- **data-pipeline**: `apps/data-pipeline/Dockerfile` - High-performance data processing
- **alarm-engine**: `services/alarm-engine/Dockerfile` - Alarm processing and notifications
- **ota-service**: `services/ota-service/Dockerfile` - Firmware OTA updates (port 8080)

### Device Gateways

- **gsm-esp32-gateway**: `apps/device-gateways/gsm-esp32/Dockerfile` - GSM/cellular devices
- **lorawan-gateway**: `apps/device-gateways/lorawan/Dockerfile` - LoRaWAN devices via ChirpStack
- **mqtt-gateway**: `apps/device-gateways/standard-mqtt/Dockerfile` - Standard MQTT with Sparkplug B

### Frontend

- **frontend**: `apps/frontend/Dockerfile` - Next.js 14 web application (port 3000)

## Building Docker Images

### Build All Images

```bash
# From project root
docker-compose -f docker-compose.production.yml build
```

### Build Individual Services

```bash
# Unified API
docker build -f apps/unified-api/Dockerfile -t webscada/unified-api:latest .

# Data Pipeline
docker build -f apps/data-pipeline/Dockerfile -t webscada/data-pipeline:latest .

# GSM Gateway
docker build -f apps/device-gateways/gsm-esp32/Dockerfile -t webscada/gsm-gateway:latest .

# LoRaWAN Gateway
docker build -f apps/device-gateways/lorawan/Dockerfile -t webscada/lorawan-gateway:latest .

# MQTT Gateway
docker build -f apps/device-gateways/standard-mqtt/Dockerfile -t webscada/mqtt-gateway:latest .

# Alarm Engine
docker build -f services/alarm-engine/Dockerfile -t webscada/alarm-engine:latest .

# OTA Service
docker build -f services/ota-service/Dockerfile -t webscada/ota-service:latest .

# Frontend
docker build -f apps/frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 \
  --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:3001 \
  -t webscada/frontend:latest .
```

## Configuration Files

### Mosquitto MQTT Broker

**File**: `infrastructure/mosquitto/mosquitto.conf`

Features:

- TLS/SSL on port 8883
- WebSocket support on port 9001
- Password authentication
- Persistence enabled
- IEC 62443 compliant

Generate passwords:

```bash
# Start mosquitto container first
docker-compose up -d mosquitto

# Generate password
docker exec -it webscada-mosquitto mosquitto_passwd -b /mosquitto/config/passwd webscada YOUR_PASSWORD
```

Generate TLS certificates:

```bash
# Use OpenSSL or Let's Encrypt
openssl req -new -x509 -days 365 -extensions v3_ca \
  -keyout infrastructure/mosquitto/certs/ca.key \
  -out infrastructure/mosquitto/certs/ca.crt

openssl genrsa -out infrastructure/mosquitto/certs/server.key 2048

openssl req -new -key infrastructure/mosquitto/certs/server.key \
  -out infrastructure/mosquitto/certs/server.csr

openssl x509 -req -in infrastructure/mosquitto/certs/server.csr \
  -CA infrastructure/mosquitto/certs/ca.crt \
  -CAkey infrastructure/mosquitto/certs/ca.key \
  -CAcreateserial -out infrastructure/mosquitto/certs/server.crt \
  -days 365
```

### ChirpStack LoRaWAN Server

**File**: `infrastructure/chirpstack/chirpstack.toml`

Features:

- PostgreSQL backend
- Redis caching
- EU868 and US915 regions
- MQTT integration
- gRPC API on port 8090
- REST API on port 8080

Update secrets in `.env`:

```bash
POSTGRES_PASSWORD=your_password
REDIS_PASSWORD=your_redis_password
CHIRPSTACK_API_KEY=your_api_key
```

### Prometheus Monitoring

**File**: `infrastructure/monitoring/prometheus.yml`

Monitors:

- All backend services
- All gateways
- Databases (PostgreSQL, InfluxDB, Redis)
- MQTT broker
- ChirpStack
- Frontend

Access: http://localhost:9090

## Running in Production

### 1. Prepare Environment

Copy and configure environment:

```bash
cp .env.example .env
# Edit .env with production values
```

### 2. Generate Secrets

```bash
# JWT secrets (min 32 characters)
openssl rand -hex 32

# Session secret
openssl rand -hex 32

# InfluxDB token
openssl rand -hex 32
```

### 3. Start Infrastructure

```bash
# Start databases and brokers
docker-compose -f docker-compose.production.yml up -d postgres influxdb redis mosquitto chirpstack

# Wait for health checks
docker-compose -f docker-compose.production.yml ps

# Run database migrations
docker-compose -f docker-compose.production.yml exec postgres psql -U webscada -d webscada -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

### 4. Start Services

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f unified-api
```

### 5. Enable Monitoring (Optional)

```bash
docker-compose -f docker-compose.production.yml --profile monitoring up -d
```

Access Grafana: http://localhost:3003 (admin/GRAFANA_PASSWORD)

## Health Checks

All services have health checks configured:

```bash
# Check all health statuses
docker-compose -f docker-compose.production.yml ps

# Individual service health
curl http://localhost:3001/health  # Unified API
curl http://localhost:3000/api/health  # Frontend
curl http://localhost:8080/api/version  # ChirpStack
```

## Resource Limits

Services have CPU and memory limits configured in docker-compose.production.yml:

- **PostgreSQL**: 2 CPU, 2GB RAM
- **InfluxDB**: 4 CPU, 4GB RAM
- **Redis**: 1 CPU, 1GB RAM
- **Mosquitto**: 2 CPU, 1GB RAM
- **Unified API**: 2 CPU, 2GB RAM (2 replicas)
- **Data Pipeline**: 4 CPU, 4GB RAM (2 replicas)
- **Frontend**: 1 CPU, 1GB RAM (2 replicas)

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs <service-name>

# Inspect container
docker inspect webscada-<service-name>
```

### Health check failing

```bash
# Execute health check manually
docker exec webscada-unified-api curl -f http://localhost:3001/health

# Check service is listening
docker exec webscada-unified-api netstat -tulpn
```

### Database connection issues

```bash
# Test PostgreSQL connection
docker exec -it webscada-postgres psql -U webscada -d webscada -c "SELECT 1"

# Test Redis connection
docker exec -it webscada-redis redis-cli -a $REDIS_PASSWORD ping
```

### MQTT connection issues

```bash
# Test MQTT connection
docker exec -it webscada-mosquitto mosquitto_sub -t '$SYS/#' -C 1
```

## Security Checklist

- [ ] Changed all default passwords in `.env`
- [ ] Generated TLS certificates for MQTT
- [ ] Configured firewall rules
- [ ] Set strong JWT secrets (min 32 chars)
- [ ] Enabled RBAC in PostgreSQL
- [ ] Generated Mosquitto password hashes
- [ ] Set CORS_ORIGIN to actual domain
- [ ] Configured rate limiting
- [ ] Enabled TLS for all MQTT connections
- [ ] Set up log aggregation
- [ ] Configured backup strategy

## Performance Tuning

### PostgreSQL

```bash
# Tune in docker-compose.production.yml or postgresql.conf
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
max_connections = 200
```

### InfluxDB

```bash
# Tune retention policies
docker exec -it webscada-influxdb influx bucket update \
  --name telemetry --retention 90d
```

### Redis

```bash
# Already configured in docker-compose.production.yml
maxmemory 1gb
maxmemory-policy allkeys-lru
```

## Backup Strategy

### PostgreSQL

```bash
# Backup
docker exec webscada-postgres pg_dump -U webscada webscada > backup.sql

# Restore
docker exec -i webscada-postgres psql -U webscada webscada < backup.sql
```

### InfluxDB

```bash
# Backup
docker exec webscada-influxdb influx backup /tmp/influx-backup
docker cp webscada-influxdb:/tmp/influx-backup ./influx-backup

# Restore
docker cp ./influx-backup webscada-influxdb:/tmp/influx-backup
docker exec webscada-influxdb influx restore /tmp/influx-backup
```

## Next Steps

- Deploy to Kubernetes (see `infrastructure/k8s/README.md`)
- Set up CI/CD pipeline
- Configure log aggregation (ELK/Loki)
- Set up alerting (Alertmanager)
- Implement backup automation
