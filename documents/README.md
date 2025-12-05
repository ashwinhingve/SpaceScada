# WebSCADA Documentation

Complete documentation for the WebSCADA industrial monitoring and control system.

## Table of Contents

- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Quick Links](#quick-links)

---

## Architecture

System architecture, design patterns, and technical specifications.

### Core Architecture

| Document | Description |
|----------|-------------|
| [`architecture/overview.md`](./architecture/overview.md) | High-level system architecture overview |
| [`architecture/components.md`](./architecture/components.md) | System components and their interactions |
| [`architecture/data-flow.md`](./architecture/data-flow.md) | Data flow patterns and processing pipeline |
| [`architecture/frontend-arch.md`](./architecture/frontend-arch.md) | Frontend architecture and design patterns |
| [`architecture/infra.md`](./architecture/infra.md) | Infrastructure and deployment architecture |

### Module-Specific Architecture

| Document | Description |
|----------|-------------|
| [`architecture/modules/gis-module.md`](./architecture/modules/gis-module.md) | GIS module architecture and Google Maps integration |
| [`architecture/modules/multi-protocol.md`](./architecture/modules/multi-protocol.md) | Multi-protocol support (ESP32, LoRaWAN, GSM, Bluetooth) |
| [`architecture/modules/realtime-pipeline.md`](./architecture/modules/realtime-pipeline.md) | Real-time data pipeline architecture |

---

## API Documentation

REST API and WebSocket endpoints documentation.

| Document | Description |
|----------|-------------|
| [`api/endpoints.md`](./api/endpoints.md) | Complete API endpoint reference |
| [`api/auth.md`](./api/auth.md) | Authentication and authorization |

---

## Quick Links

### Getting Started

- [Deployment Guide](../DEPLOYMENT.md) - Production deployment instructions
- [Deployment Checklist](../DEPLOYMENT-CHECKLIST.md) - Pre-deployment verification
- [README](../README.md) - Project overview and quick start

### Architecture Overview

```
WebSCADA System
├── Frontend (Next.js 14)
│   ├── Web Dashboard
│   ├── Real-time Monitoring
│   └── GIS Mapping
├── Backend (Fastify)
│   ├── REST API
│   ├── WebSocket Server
│   └── Device Management
├── Realtime Service
│   ├── Device Data Ingestion
│   ├── Protocol Handlers
│   └── Data Processing
└── Infrastructure
    ├── PostgreSQL (Data Storage)
    ├── Redis (Caching & Pub/Sub)
    ├── Mosquitto (MQTT Broker)
    └── InfluxDB (Time-Series Data)
```

### Supported Protocols

- **ESP32**: MQTT-based IoT device communication
- **LoRaWAN**: Long-range wireless via ChirpStack
- **GSM**: Cellular device communication
- **Bluetooth**: Short-range wireless device connectivity

### Key Features

- Real-time device monitoring
- Multi-protocol device support
- GIS mapping with Google Maps
- Time-series data analytics
- Alarm and notification system
- RESTful API and WebSocket
- Production-ready Docker deployment

---

## Document Organization

### Architecture Documents

Core system design and technical specifications. Start with `overview.md` for a high-level understanding, then dive into specific components.

**Best for**: Developers, architects, and technical stakeholders.

### API Documentation

Complete API reference for integration and development.

**Best for**: Frontend developers, API consumers, and integration partners.

---

## Contributing to Documentation

When adding or updating documentation:

1. **Location**: Place documents in appropriate directories
2. **Naming**: Use descriptive, kebab-case filenames
3. **Structure**: Follow existing document structure
4. **Index**: Update this README when adding new documents
5. **Links**: Use relative links between documents
6. **Clarity**: Write for your audience's technical level

---

## Additional Resources

- **Source Code**: See `/apps` and `/packages` directories
- **Infrastructure**: See `/infrastructure` directory
- **Deployment**: See root `DEPLOYMENT.md`
- **Environment**: See `.env.production.example`

---

*Last Updated*: 2025-12-05
*Documentation Version*: 2.0.0
