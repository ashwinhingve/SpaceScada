# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

WebSCADA is a TypeScript monorepo providing a modern industrial SCADA platform. It consists of:

- **Frontend** (`apps/frontend`): Next.js 14 dashboard and console UI.
- **Backend API** (`apps/backend`): Fastify-based REST + WebSocket server talking to PostgreSQL, Redis, MQTT, InfluxDB, and protocol adapters.
- **Realtime Service** (`apps/realtime-service`): Fastify + Socket.io service focused on simulated real-time device data, metrics, and WebSocket connections.
- **Shared packages** (`packages/*`): common types, utilities, and a multi-protocol connectivity library (`@webscada/protocols`).
- **Docs / Infra / Firmware**:
  - `documents/` – architecture and API docs (detailed design lives here).
  - `infrastructure/` – Docker, Nginx, DB, MQTT, ChirpStack, InfluxDB configs.
  - `firmware/esp32/` – ESP32 firmware for MQTT-based sensor devices.

The root `README.md` and `documents/README.md` contain deployment and architecture details; prefer those for deep system questions.

## Local development & core commands

### Tooling and prerequisites

- Node.js `>=18.0.0`, pnpm `>=8.0.0` (see root `package.json`).
- Docker + Docker Compose if you want PostgreSQL, Redis, and Mosquitto locally (recommended to match production).

### Install and run everything in dev mode

From the repo root:

```bash
pnpm install                      # install all workspace dependencies

# start core infra services used in development
docker-compose -f docker-compose.vps.yml up -d postgres redis mosquitto

# run all app dev servers via Turborepo (frontend, backend, realtime-service)
pnpm dev
```

Service defaults (from docs/README and config):

- Frontend (Next.js): `http://localhost:3000`
- Backend API (Fastify): `http://localhost:3001`
- Realtime Service: `http://localhost:3002`

Environment variables are typically loaded from `.env.*` files. Critical ones called out in `README.md` include:

- `DATABASE_URL`, `REDIS_URL`
- `JWT_SECRET`, `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

### Running individual workspaces

You can work on each app/package independently by running its scripts directly.

**Backend API (`apps/backend`)**

```bash
cd apps/backend
pnpm dev         # Fastify backend on PORT (default 3001)
pnpm build       # tsc -> dist/
pnpm start       # run built server from dist/
```

The backend connects to PostgreSQL via `DATABASE_URL`, Redis via `REDIS_URL`, and an MQTT broker (`MQTT_BROKER_HOST`/`MQTT_BROKER_PORT` or `MQTT_BROKER`).

**Frontend (`apps/frontend`)**

```bash
cd apps/frontend
pnpm dev         # Next.js dev server on 3000
pnpm build       # wraps `pnpm exec next build` via custom build.js
pnpm start       # `next start` (requires successful build)
```

`next.config.js` sets defaults when env vars are absent:

- `NEXT_PUBLIC_API_URL` → `http://localhost:3001`
- `NEXT_PUBLIC_WS_URL` → `ws://localhost:3001`

Note: the API helper modules (`src/core/api/client.ts`, `src/lib/api.ts`) default to `http://localhost:3002` if `NEXT_PUBLIC_API_URL` is unset. Be explicit about `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_WS_URL` in your env when wiring UI features to either the backend API (3001) or the realtime service (3002).

**Realtime Service (`apps/realtime-service`)**

```bash
cd apps/realtime-service
pnpm dev         # Fastify + Socket.io dev server (default port 3002)
pnpm build       # tsc -> dist/
pnpm start       # run built realtime service
```

Configuration is centralized in `apps/realtime-service/src/config/index.ts` and validated with Joi. Defaults include:

- `PORT` → 3002, `HOST` → `0.0.0.0`
- `CORS_ORIGIN` → `http://localhost:3000`
- heartbeat & update intervals, metrics toggle, optional `REDIS_URL`.

**Protocols package (`packages/protocols`)**

```bash
cd packages/protocols
pnpm dev         # tsc --watch
pnpm build       # tsc -> dist/
```

This library is consumed by the backend (e.g., via `@webscada/protocols`) and provides protocol abstraction and adapters.

### Linting and type-checking

Monorepo-level (runs via Turborepo across workspaces):

```bash
# run each package's `lint` script via turbo
pnpm lint

# run TypeScript `--noEmit` across workspaces
pnpm type-check
```

Package-level examples:

```bash
cd apps/backend
pnpm lint         # wraps `pnpm exec eslint src --ext .ts`
pnpm type-check   # tsc --noEmit

cd apps/frontend
pnpm lint         # wraps `next lint`
pnpm type-check   # tsc --noEmit (via type-check.js)

cd apps/realtime-service
pnpm lint         # custom lint wrapper (if present)
pnpm type-check   # tsc --noEmit
```

Many lint/type-check scripts are thin Node wrappers that swallow known pnpm/WSL store issues and exit successfully to avoid breaking pipelines; they may not fail the build on configuration-level errors.

### Building and Docker

From the repo root:

```bash
pnpm build                     # `turbo run build` across apps & packages

pnpm docker:build              # docker-compose build (see docker-compose.vps.yml)
pnpm docker:up                 # docker-compose up -d for full stack
pnpm docker:down               # docker-compose down
```

For production deployment, the authoritative flow is in `DEPLOYMENT.md` and the root `README.md` (`deploy-vps.sh`, Nginx, SSL, backups, etc.).

### Testing status

- Turborepo defines a `test` task in `turbo.json`, but there is **no root `test` script**.
- `apps/realtime-service/package.json` exposes `pnpm test`, which currently only prints `"Tests not yet implemented"` and does not run a test runner.
- There is no configured Jest/Vitest/Playwright suite or example tests in this repo at present.

Until a real test framework is introduced and wired into workspace `test` scripts, there is no meaningful way to "run a single test" beyond any future testing setup you add.

## High-level architecture

### Monorepo layout and responsibilities

- **apps/frontend** – Next.js 14 App Router application providing:
  - Marketing/landing page at `/` (`src/app/page.tsx`).
  - An operations console rooted at `/console` (e.g., `/console/dashboard`), with feature-focused component groups under `src/components/*`:
    - `console/`, `dashboard/`, `esp32/`, `gis/`, `gsm/`, `telemetry/`.
  - Reusable UI primitives under `src/components/ui/` (shadcn/Radix-style button, dialog, data-table, etc.).
  - Global state via `src/store/dashboard-store.ts` and `src/stores/widgetStore.ts` for dashboard layout and real-time device data.

- **apps/backend** – primary REST + WebSocket API server:
  - Fastify instance constructed in `src/server.ts`, with security middleware (Helmet, CORS, rate limiting) and service initialization.
  - Integrates:
    - `DatabaseService` (`src/services/database.ts`) – singleton `pg.Pool` using `DATABASE_URL`, with basic health check on startup.
    - `RedisService` – Redis client/pool for caching and pub/sub.
    - Protocol-specific services (`ESP32Service`, `GSMService`, `WiFiService`, `BluetoothService`, `TelemetryService`, `LogsService`, `mqttValveService`, `influxTimeSeriesService`).
  - Routes are modularized under `src/routes/` (e.g., `devices.ts`, `gsm.ts`, `esp32.ts`, `wifi.ts`, `bluetooth.ts`, `lorawan.ts`, `tags.ts`, `alarms.ts`, `users.ts`, `widgets.ts`).
    - Each route registers under a prefix (e.g., `/api/devices`) and typically returns an `ApiResponse<T>` from `@webscada/shared-types`.
    - Many routes are currently skeletons with TODOs where DB integration should go.
  - WebSocket support via `src/websocket.ts`:
    - Attaches a Socket.io server to the Fastify HTTP server and decorates `fastify.io`.
    - Implements subscription rooms for tag updates and protocol-specific channels (e.g., `gsm:{deviceId}`, `esp32:{deviceId}`).
    - Exposes helpers `broadcastEvent` and `broadcastGSMEvent` to publish SCADA and GSM events to subscribers.

- **apps/realtime-service** – real-time simulation and metrics service:
  - Fastify instance created in `src/server.ts` with Helmet, CORS, rate limiting, and metrics hooks.
  - Uses `MetricsService` and `DeviceService` to track simulated devices and Prometheus-style metrics (via `prom-client`).
  - WebSocket layer encapsulated in `src/websocket/index.ts` as a `WebSocketServer` class:
    - Manages a Socket.io server attached to the HTTP server.
    - Tracks `ConnectionInfo` in memory, maintains heartbeat intervals, and disconnects stale connections.
    - Implements `SUBSCRIBE` / `UNSUBSCRIBE` semantics (rooms named `device:{deviceId}`) and records WebSocket metrics.
  - A `SimulationEngine` in `src/simulation/engine.ts` publishes synthetic device data into WebSocket rooms and metrics; `server.ts` starts this engine and decorates the Fastify instance with `simulationEngine`, `wsServer`, and `deviceService` for graceful shutdown.
  - REST API routes grouped under `/api` (`routes/devices.ts`, `routes/health.ts`, `routes/metrics.ts`) expose simulated device listings, health checks, and Prometheus metrics.

- **packages/protocols (@webscada/protocols)** – multi-protocol connectivity layer:
  - Entry point `src/index.ts` re-exports:
    - **Abstraction layer** (`./abstraction`) – base protocol adapter interfaces and abstract classes.
    - **Normalization** (`./normalization`) – Sparkplug B–style normalized payloads.
    - **Registry** (`./registry`) – plugin system for registering protocol adapters.
    - **Adapters** (`./adapters`) – concrete protocol adapter implementations.
  - Concrete adapters include:
    - `MQTTAdapter` (`src/mqtt.ts`) – wraps `mqtt` client, manages topic subscriptions, payload parsing, and ESP32-specific helpers (`publishControl`, `subscribeToDevice`).
    - `GSMAdapter` (`src/gsm.ts`) – GSM/HTTP/MQTT abstraction for cellular modules (A7670C), including SMS, GPS, network status, and AT-command helpers.
    - `ModbusTCPAdapter` and `ModbusRTUAdapter` (`src/modbus.ts`) – Modbus connectivity stubs with clear extension points for real drivers.
  - Backend services use these adapters to communicate with field devices, while presenting a uniform interface to higher-level services.

- **Shared docs and firmware**:
  - `documents/architecture/*` – high-level architecture, data-flow, frontend architecture, multi-protocol and realtime pipeline design. Use these when making non-trivial architectural changes.
  - `documents/api/*` – REST and WebSocket endpoint specifications.
  - `firmware/esp32/README.md` – describes the ESP32 MQTT firmware and topic conventions:
    - `devices/{deviceId}/data`, `devices/{deviceId}/status`, `devices/{deviceId}/online`, `devices/{deviceId}/control`.
    - This aligns with the MQTT adapter and backend ESP32 service expectations.

### Data & transport flows

Conceptually, the system is wired as follows:

- **HTTP/REST**
  - Backend API (`apps/backend`) exposes REST endpoints under `/api/*` for device, tag, alarm, user, and widget management.
  - Realtime service (`apps/realtime-service`) exposes `/api/devices`, `/api/health`, `/api/metrics` for simulated device data and operational metrics.
  - Frontend HTTP clients:
    - `apps/frontend/src/lib/api.ts` – entity-centric client for Projects, Organizations, Gateways, Devices, Tags, Alarms, etc., using `NEXT_PUBLIC_API_URL` (defaulting to `http://localhost:3002` if unset).
    - `apps/frontend/src/core/api/client.ts` – newer generic API client with interceptors, richer error handling, and request/response hooks.

- **WebSocket (Socket.io)**
  - Backend Socket.io server (`apps/backend/src/websocket.ts`) handles:
    - Tag subscriptions (`subscribe:tags` / `unsubscribe:tags`).
    - Protocol-specific rooms like `gsm:{deviceId}` and `esp32:{deviceId}` for SMS, GPS, and device control/telemetry.
  - Realtime-service Socket.io server (`apps/realtime-service/src/websocket/index.ts`) handles:
    - `connection` / `disconnect`, `SUBSCRIBE` / `UNSUBSCRIBE` events with payloads specifying device IDs.
    - Heartbeats and stale-connection cleanup driven by `HEARTBEAT` / `PONG` events and configured timeouts.
  - Frontend real-time consumption:
    - `apps/frontend/src/hooks/useWebSocket.ts` is the preferred integration point.
      - Accepts a `url` (usually based on `NEXT_PUBLIC_WS_URL` or the realtime-service URL).
      - Manages connection status, exponential backoff reconnection, heartbeat pings, and dispatches `data:update` and `device:status` events into the dashboard store.
    - `apps/frontend/src/lib/socket.ts` (`socketService`) is currently marked as unused; future work should favor the hook-based approach.

- **MQTT & protocols**
  - Devices (e.g., ESP32 firmware) publish sensor data and receive control commands via MQTT topics under `devices/{deviceId}/...` (see `firmware/esp32/README.md`).
  - `@webscada/protocols`’ `MQTTAdapter` and backend ESP32-related services (`ESP32Service`, `mqttValveService`) bridge MQTT topics into SCADA events and DB/telemetry writes.
  - LoRaWAN/ChirpStack, GSM, WiFi, and Bluetooth integrations follow the same pattern via their respective services and adapters.

- **Database & telemetry**
  - PostgreSQL is the primary relational store for configuration and historical telemetry summaries.
  - `TelemetryService` (`apps/backend/src/services/telemetry.service.ts`):
    - Writes individual or batched telemetry records into a `device_telemetry` table.
    - Provides range queries and aggregated views (hourly/daily) via SQL `date_trunc` and aggregation.
  - InfluxDB (optional) is initialized via `influxTimeSeriesService` for high-resolution time-series data; failures are caught and logged, and non-availability gracefully degrades these features.
  - Redis is used for caching and pub/sub across services; details live in `apps/backend/src/services/redis.ts` and realtime-service config for optional `REDIS_URL`.

### Frontend patterns and guidance

When extending the UI:

- Prefer existing domain component groups under `src/components/*` (e.g., `dashboard/`, `console/`, `gis/`) to keep features cohesive.
- Use the API helper layer (`src/core/api/client.ts` or `src/lib/api.ts`) rather than calling `fetch` directly, to benefit from shared error handling and typing.
- For real-time dashboard features, use `useWebSocket` and the dashboard store (`useDashboardStore`) instead of instantiating new Socket.io clients manually.
- Use the entity types in `apps/frontend/src/types` and `@webscada/shared-types` for type safety across the stack.

### Backend patterns and guidance

When adding backend features:

- Register new Fastify routes as modules under `apps/backend/src/routes/` and mount them with a clear `prefix` in `src/server.ts`.
- Reuse `DatabaseService` for DB access and follow the logging conventions via `createLogger` from `@webscada/utils`.
- Prefer emitting SCADA or GSM events through `broadcastEvent` / `broadcastGSMEvent` so WebSocket consumers (frontend, realtime dashboards) receive consistent payloads.
- For new device telemetry or real-time metrics, consider whether it belongs in the backend API, the realtime-service, or both; check `documents/architecture/data-flow.md` and `documents/architecture/modules/realtime-pipeline.md` before making cross-cutting changes.

### Documentation entry points

For any non-trivial modification, consult these docs first:

- `documents/architecture/overview.md` – overall system architecture.
- `documents/architecture/frontend-arch.md` – frontend structure and patterns.
- `documents/architecture/modules/multi-protocol.md` – device/protocol integration strategy.
- `documents/architecture/modules/realtime-pipeline.md` – how the realtime-service, MQTT, and backend API cooperate.
- `documents/api/endpoints.md` & `documents/api/auth.md` – REST and auth contracts to keep backend and frontend in sync.

These documents are the source of truth for cross-service flows and should guide any changes to how data moves between devices, protocols, backend, realtime-service, and the UI.
