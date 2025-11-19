# Claude.md - WebSCADA Project Guide

> **AI Assistant Onboarding Document**
>
> This document provides comprehensive context about the WebSCADA project for AI assistants like Claude to effectively understand, navigate, and contribute to the codebase.

## Project Overview

**WebSCADA** is a modern, cloud-native industrial monitoring and control system (SCADA - Supervisory Control and Data Acquisition) built as a web application. It provides real-time monitoring of industrial devices, data visualization, alarm management, and control capabilities.

**Type:** Full-stack industrial IoT platform
**Architecture:** Microservices-based monorepo
**Deployment:** Kubernetes-native with Docker containers
**Stage:** MVP (Minimum Viable Product)

## Quick Facts

- **Language:** TypeScript (99%)
- **Package Manager:** pnpm with workspaces
- **Build System:** Turbo (monorepo orchestration)
- **Runtime:** Node.js 18+
- **Deployment:** Kubernetes + Docker
- **License:** Private

## Tech Stack

### Frontend

- **Framework:** Next.js 14 (React 18)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, Recharts
- **State Management:** React Context + Hooks
- **Real-time:** Socket.io Client
- **Type Safety:** TypeScript 5.3

### Backend

- **Framework:** Fastify 4.x
- **Database:** PostgreSQL 16 (with pg driver)
- **Cache:** Redis 7
- **WebSocket:** Socket.io
- **Validation:** Zod
- **Type Safety:** TypeScript 5.3

### Infrastructure

- **Container:** Docker + Docker Compose
- **Orchestration:** Kubernetes (Minikube/Kind for local)
- **Build:** Skaffold (development)
- **Deployment:** Helm charts + kubectl manifests
- **Monitoring:** Prometheus + Grafana

### Protocols & Simulation

- **Industrial Protocols:** Modbus, MQTT, OPC UA (simulated)
- **Device Simulation:** Custom TypeScript simulators

## Project Structure

```
webscada/
├── apps/                          # Applications
│   ├── backend/                   # Fastify API server
│   │   ├── src/
│   │   │   ├── routes/           # API endpoints
│   │   │   ├── services/         # Business logic
│   │   │   ├── websocket.ts      # WebSocket handler
│   │   │   ├── server.ts         # Fastify server setup
│   │   │   └── index.ts          # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                  # Next.js web application
│   │   ├── src/
│   │   │   ├── app/              # Next.js 14 app router
│   │   │   ├── components/       # React components
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── lib/              # Utilities & API client
│   │   │   └── styles/           # Global styles
│   │   ├── public/               # Static assets
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── realtime-service/          # Fastify real-time data service
│   │   ├── src/
│   │   │   ├── routes/           # Real-time data endpoints
│   │   │   ├── services/         # Device & data services
│   │   │   └── server.ts
│   │   └── package.json
│   │
│   └── simulator/                 # Device simulator
│       ├── src/
│       │   ├── simulators/       # Protocol-specific simulators
│       │   └── index.ts
│       └── package.json
│
├── packages/                      # Shared libraries
│   ├── shared-types/             # TypeScript type definitions
│   │   ├── src/
│   │   │   ├── device.ts        # Device types
│   │   │   ├── tag.ts           # Tag/datapoint types
│   │   │   ├── alarm.ts         # Alarm types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                    # Shared utilities
│   │   ├── src/
│   │   │   ├── logger.ts        # Logging utility
│   │   │   ├── retry.ts         # Retry logic
│   │   │   ├── validation.ts    # Validation helpers
│   │   │   └── time.ts          # Time utilities
│   │   └── package.json
│   │
│   └── protocols/                # Industrial protocol handlers
│       ├── src/
│       │   ├── modbus.ts        # Modbus protocol
│       │   ├── mqtt.ts          # MQTT protocol
│       │   ├── opcua.ts         # OPC UA protocol
│       │   └── base.ts          # Base protocol interface
│       └── package.json
│
├── infrastructure/                # Deployment configurations
│   ├── docker/                   # Dockerfiles
│   │   ├── backend.Dockerfile
│   │   ├── frontend.Dockerfile
│   │   └── simulator.Dockerfile
│   │
│   ├── k8s/                      # Kubernetes manifests
│   │   ├── base/                 # ConfigMaps & Secrets
│   │   ├── monitoring/           # Prometheus/Grafana
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── ingress.yaml
│   │   └── README.md
│   │
│   └── helm/                     # Helm charts
│       └── values/
│           ├── postgresql-values.yaml
│           └── redis-values.yaml
│
├── scripts/                       # Automation scripts
│   └── k8s-deploy.sh
│
├── .husky/                        # Git hooks
├── package.json                   # Root package.json
├── pnpm-workspace.yaml           # pnpm workspace config
├── turbo.json                    # Turbo build config
├── docker-compose.yml            # Local Docker setup
├── skaffold.yaml                 # Skaffold dev config
├── deploy.sh                     # Deployment automation
│
├── ARCHITECTURE.md               # System architecture
├── DEPLOYMENT.md                 # Deployment procedures (old)
├── DEPLOYMENT-GUIDE.md           # Comprehensive deployment guide
├── CODEBASE-VERIFICATION.md      # Verification & fixes report
└── claude.md                     # This file
```

## Key Concepts

### 1. Monorepo Structure

- Uses **pnpm workspaces** for package management
- **Turbo** orchestrates builds and type-checking across packages
- Shared packages (`shared-types`, `utils`, `protocols`) are consumed by apps
- Workspace references: `"@webscada/shared-types": "workspace:*"`

### 2. Device Model

A **Device** represents an industrial machine or sensor:

```typescript
interface Device {
  id: string;
  name: string;
  type: 'plc' | 'sensor' | 'actuator';
  protocol: 'modbus' | 'mqtt' | 'opcua';
  connectionStatus: 'connected' | 'disconnected' | 'error';
  tags: Tag[];
}
```

### 3. Tag (Data Point) Model

A **Tag** represents a single data point from a device:

```typescript
interface Tag {
  id: string;
  deviceId: string;
  name: string;
  dataType: 'number' | 'boolean' | 'string';
  value: any;
  unit?: string;
  timestamp: Date;
}
```

### 4. Real-time Architecture

- **WebSocket** connections for live data updates
- **Redis** pub/sub for inter-service communication
- **PostgreSQL** for persistent storage
- **Socket.io** for bidirectional client-server communication

### 5. Protocol Abstraction

All industrial protocols implement a common interface:

```typescript
interface ProtocolHandler {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  readTag(tagId: string): Promise<TagValue>;
  writeTag(tagId: string, value: any): Promise<void>;
}
```

## Important Files & Their Purpose

### Configuration Files

| File                       | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| `package.json` (root)      | Workspace scripts, dev dependencies, pnpm version |
| `pnpm-workspace.yaml`      | Defines workspace packages (apps/_, packages/_)   |
| `turbo.json`               | Build pipeline configuration, caching rules       |
| `tsconfig.json` (multiple) | TypeScript configuration per package              |
| `.eslintrc.js`             | ESLint rules for code quality                     |
| `.prettierrc.js`           | Code formatting rules                             |
| `docker-compose.yml`       | Local development environment (Postgres, Redis)   |
| `skaffold.yaml`            | Kubernetes development workflow                   |

### Entry Points

| Application      | Entry Point                          | Port |
| ---------------- | ------------------------------------ | ---- |
| Frontend         | `apps/frontend/src/app/page.tsx`     | 3000 |
| Backend          | `apps/backend/src/index.ts`          | 3001 |
| Realtime Service | `apps/realtime-service/src/index.ts` | 3002 |
| Simulator        | `apps/simulator/src/index.ts`        | 3003 |

### Key Routes

**Backend API (`/api`):**

- `GET /health` - Health check
- `GET /devices` - List all devices
- `POST /devices` - Create device
- `GET /devices/:id/tags` - Get device tags
- `POST /tags/:id/write` - Write to tag
- `GET /alarms` - List alarms

**Frontend Pages:**

- `/` - Landing page
- `/dashboard` - Main dashboard with real-time data
- `/devices` - Device management
- `/alarms` - Alarm management

## Development Workflow

### Prerequisites

```bash
# Node.js 18+
node -v  # Should be >= 18.0.0

# pnpm 8+
pnpm -v  # Should be >= 8.0.0

# Docker & Docker Compose (for local databases)
docker -v
docker-compose -v

# Kubernetes (optional, for deployment)
kubectl version
```

### Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start databases (Postgres, Redis)
docker-compose up -d

# 3. Run database migrations (if needed)
cd apps/backend
pnpm db:migrate

# 4. Start all services in development mode
cd ../..
pnpm dev
```

### Common Commands

```bash
# Development
pnpm dev                    # Start all apps in watch mode
pnpm dev --filter=backend   # Start only backend

# Building
pnpm build                  # Build all packages
pnpm build --filter=frontend # Build only frontend

# Type Checking
pnpm type-check            # Type check all packages
pnpm type-check --filter=backend # Check only backend

# Linting & Formatting
pnpm lint                  # Lint all packages
pnpm format                # Format code with Prettier

# Testing
pnpm test                  # Run all tests

# Docker
docker-compose up -d       # Start databases
docker-compose down        # Stop databases

# Kubernetes (local)
skaffold dev               # Deploy to K8s with hot reload
./deploy.sh install        # Full K8s deployment
```

### Package Scripts (from root)

All scripts use **Turbo** for parallel execution and caching:

- `pnpm dev` → Runs `turbo run dev`
- `pnpm build` → Runs `turbo run build`
- `pnpm type-check` → Runs `turbo run type-check`
- `pnpm lint` → Runs `turbo run lint`

## TypeScript Configuration

### Important Notes

1. **Workspace References:**
   - Packages import each other using `@webscada/*` aliases
   - Example: `import { Device } from '@webscada/shared-types'`

2. **Type Definitions:**
   - All packages have `types: ["node"]` in `tsconfig.json`
   - This provides Node.js globals like `console`, `setTimeout`, `process`

3. **Common Issues:**
   - **Missing @types/node:** Already fixed, added to all packages
   - **Module not found:** Check workspace symlinks exist in `node_modules/@webscada/`
   - **rootDir errors:** Don't set `rootDir` in packages that import from workspace

4. **Build Process:**
   - Shared packages (`shared-types`, `utils`, `protocols`) build first
   - Apps depend on built packages via Turbo's dependency graph

## Code Style & Conventions

### Naming Conventions

- **Files:** `kebab-case.ts` (e.g., `device-service.ts`)
- **Components:** `PascalCase.tsx` (e.g., `DeviceCard.tsx`)
- **Variables:** `camelCase` (e.g., `deviceId`)
- **Types/Interfaces:** `PascalCase` (e.g., `Device`, `TagValue`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)

### Import Order

```typescript
// 1. External packages
import { useState } from 'react';
import { FastifyInstance } from 'fastify';

// 2. Workspace packages
import { Device } from '@webscada/shared-types';
import { createLogger } from '@webscada/utils';

// 3. Relative imports
import { DeviceCard } from '../components/DeviceCard';
import { formatDate } from './helpers';
```

### TypeScript Best Practices

- **Always type function parameters and return types**
- Use **interface** for object shapes (not type alias)
- Prefer **const** over let
- Use **enums** for fixed sets of values
- Avoid `any` - use `unknown` if type is truly unknown

### React Conventions

- Use **functional components** with hooks
- Prefer **named exports** over default exports
- Extract complex logic into **custom hooks**
- Use **React.FC** or explicit return types for components

## Database Schema

### Key Tables

**devices:**

```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  protocol VARCHAR(50) NOT NULL,
  connection_status VARCHAR(50),
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**tags:**

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  name VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  value JSONB,
  unit VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**alarms:**

```sql
CREATE TABLE alarms (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  tag_id UUID REFERENCES tags(id),
  severity VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP
);
```

## Environment Variables

### Backend (.env)

```bash
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://webscada:webscada_password@localhost:5432/webscada

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Frontend (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Environment
NODE_ENV=development
```

## Deployment

### Local Development (Docker Compose)

```bash
docker-compose up -d     # Starts Postgres + Redis
pnpm dev                 # Starts all apps
```

### Kubernetes (Minikube/Kind)

```bash
# Using Skaffold (recommended for development)
skaffold dev

# Or manual deployment
./deploy.sh install -n webscada

# Check status
kubectl get pods -n webscada
```

### Production Deployment

See `DEPLOYMENT-GUIDE.md` for comprehensive instructions.

**Quick steps:**

1. Build Docker images: `docker-compose build`
2. Push to registry: `docker push`
3. Deploy with Helm or kubectl: `./deploy.sh install -n webscada -e prod`

## Troubleshooting

### Type Errors: "Cannot find module '@webscada/...'"

**Cause:** Missing workspace symlinks in node_modules

**Fix:**

```bash
# Recreate symlinks
cd apps/backend
mkdir -p node_modules/@webscada
ln -s ../../../../packages/utils node_modules/@webscada/utils
ln -s ../../../../packages/shared-types node_modules/@webscada/shared-types
```

Or run full install:

```bash
pnpm install --force
```

### Type Errors: "Cannot find name 'console'" or "setTimeout"

**Cause:** Missing @types/node

**Fix:** Already fixed in codebase. If it reappears:

```bash
cd packages/utils
pnpm add -D @types/node@^20.10.0
```

And ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

### Frontend build fails: "next: command not found"

**Cause:** Next.js binary not in PATH

**Fix:**

```bash
# Use pnpm exec
cd apps/frontend
pnpm exec next build

# Or use pnpx
pnpx next build
```

### WebSocket connection fails

**Checks:**

1. Backend is running: `curl http://localhost:3001/health`
2. CORS is configured: Check `CORS_ORIGIN` in backend `.env`
3. Frontend URL is correct: Check `NEXT_PUBLIC_WS_URL` in frontend `.env.local`

### Docker compose issues

```bash
# Reset everything
docker-compose down -v
docker-compose up -d

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter=backend

# Watch mode
pnpm test --watch
```

### Integration Tests

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
pnpm test:integration
```

### E2E Tests

```bash
# Start all services
pnpm dev

# Run E2E tests (in another terminal)
cd apps/frontend
pnpm test:e2e
```

## Security Considerations

### Secrets Management

- **Development:** Plain secrets in `.env` files (gitignored)
- **Production:** Use **Kubernetes Secrets** or **SealedSecrets**
- **Never commit:** API keys, passwords, connection strings

### Input Validation

- All API endpoints use **Zod** schemas for validation
- Frontend validates user input before sending to backend
- SQL injection prevented by using **parameterized queries** (pg driver)

### Authentication (Future)

- Planned: JWT-based authentication
- Role-based access control (RBAC)
- Session management with Redis

## Performance Optimization

### Frontend

- **Code splitting:** Automatic with Next.js 14
- **Image optimization:** Use Next.js `<Image>` component
- **Caching:** React Query for data fetching (future)

### Backend

- **Connection pooling:** PostgreSQL pool configuration
- **Redis caching:** Cache frequent queries
- **Rate limiting:** Fastify rate-limit plugin

### Database

- **Indexes:** On frequently queried columns
- **Partitioning:** Time-series data partitioned by date (future)
- **Vacuum:** Regular PostgreSQL maintenance

## Known Issues & Limitations

1. **Realtime Service Type Warnings:**
   - 11 non-critical TypeScript warnings
   - Doesn't affect functionality
   - Related to Fastify type definitions

2. **pnpm Symlinks on Windows WSL2:**
   - May need manual symlink recreation after some operations
   - Use `pnpm install --force` if issues persist

3. **Next.js Binary in PATH:**
   - Use `pnpm exec next` instead of `next` directly

4. **Frontend Build:**
   - Requires full `pnpm install` before first build
   - Development mode (`pnpm dev`) works without full install

## Resources & Documentation

### Internal Documentation

All documentation has been organized in the `/docs` directory:

- `docs/architecture/ARCHITECTURE.md` - System design and architecture decisions
- `docs/deployment/DEPLOYMENT-GUIDE.md` - Complete deployment procedures
- `docs/development/CODEBASE-VERIFICATION.md` - Verification report with all fixes
- `docs/infrastructure/k8s-readme.md` - Kubernetes deployment details
- `docs/development/CONTRIBUTING.md` - Contribution guidelines
- `docs/guides/` - Integration guides for ESP32, GSM, and other devices
- `docs/frontend/` - Frontend-specific documentation

See [docs/README.md](./docs/README.md) for the complete documentation index.

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [pnpm Documentation](https://pnpm.io/)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Skaffold Documentation](https://skaffold.dev/docs/)

## Quick Reference Commands

```bash
# Development
pnpm dev                           # Start all apps
pnpm dev --filter=backend          # Start only backend
pnpm dev --filter=frontend         # Start only frontend

# Building
pnpm build                         # Build all
pnpm build --filter=@webscada/*    # Build all packages only

# Type Checking
pnpm type-check                    # Check all
pnpm type-check --filter=backend   # Check backend only

# Linting
pnpm lint                          # Lint all
pnpm lint --fix                    # Auto-fix issues

# Database
docker-compose up -d postgres      # Start Postgres
docker-compose exec postgres psql -U webscada  # Connect to DB

# Kubernetes
kubectl get pods -n webscada       # List pods
kubectl logs -f deployment/backend -n webscada  # Follow logs
kubectl port-forward svc/frontend 3000:3000 -n webscada  # Port forward

# Deployment
./deploy.sh install -n webscada    # Install to K8s
./deploy.sh status -n webscada     # Check status
./deploy.sh rollback -n webscada   # Rollback
```

## Git Workflow

### Branch Naming

- `feature/[feature-name]` - New features
- `fix/[bug-name]` - Bug fixes
- `refactor/[what]` - Code refactoring
- `docs/[what]` - Documentation updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add device connection status indicator
fix: resolve WebSocket reconnection issue
docs: update deployment guide
refactor: extract device service logic
chore: update dependencies
```

### Pre-commit Hooks

- **Husky** runs:
  - `lint-staged` - Lints staged files
  - `commitlint` - Validates commit messages
  - Type checking on changed packages

## Contact & Support

**For Questions:**

- Check this `claude.md` file first
- Review `CODEBASE-VERIFICATION.md` for common issues
- See `DEPLOYMENT-GUIDE.md` for deployment problems
- Refer to package-specific README files

**For AI Assistants:**

- This file should provide sufficient context for most tasks
- Always verify TypeScript configurations before making changes
- Use `pnpm exec` or `pnpx` for commands, not direct binary calls
- Remember: This is a monorepo with workspace dependencies

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
**Codebase Status:** ✅ Verified and Operational
