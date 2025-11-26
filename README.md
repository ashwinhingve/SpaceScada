# WebSCADA System

A modern, cloud-native SCADA (Supervisory Control and Data Acquisition) system built with a microservices architecture using Turborepo.

## Tech Stack

- **Monorepo**: Turborepo with pnpm workspaces
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Fastify, TypeScript
- **Real-time**: Socket.io, WebSocket
- **Database**: PostgreSQL, Redis
- **Container**: Docker
- **Orchestration**: K3s
- **Build System**: Turbo for fast, efficient builds

## Project Structure

This is a Turborepo monorepo organized into apps and packages:

```
webscada/
├── apps/                      # Applications
│   ├── frontend/             # Next.js web application
│   ├── backend/              # Fastify API server
│   ├── realtime-service/     # Real-time data service
│   └── simulator/            # Device simulator for testing
├── packages/                  # Shared packages
│   ├── shared-types/         # Shared TypeScript types
│   ├── utils/                # Common utilities
│   └── protocols/            # Protocol implementations (LoRaWAN, GSM, Wi-Fi, Bluetooth)
├── infrastructure/            # Deployment configs
│   ├── k8s/                  # K3s manifests
│   ├── docker/               # Dockerfiles
│   └── helm/                 # Helm charts
├── documents/                 # All project documentation
│   ├── architecture/         # System architecture docs
│   ├── developer-guides/     # Development guides
│   ├── api/                  # API documentation
│   ├── operations/           # Deployment and operations
│   ├── user-guides/          # End-user documentation
│   ├── migrations/           # Change history
│   └── assets/               # Diagrams and images
├── firmware/                  # Embedded firmware
│   └── esp32/                # ESP32 Arduino firmware
├── scripts/                   # Automation scripts
├── tests/                     # Integration tests
├── docker-compose.yml         # Local development
├── skaffold.yaml             # K8s development workflow
└── package.json              # Monorepo config (pnpm workspaces)
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- K3s cluster (for production deployment)

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

Turborepo runs tasks in parallel with intelligent caching:

```bash
# Run all apps in development mode
pnpm dev

# Run specific app (using Turbo's filter)
pnpm dev --filter=@webscada/frontend
pnpm dev --filter=@webscada/backend
pnpm dev --filter=@webscada/simulator
pnpm dev --filter=@webscada/realtime-service
```

### Build

```bash
# Build all apps and packages (with Turbo caching)
pnpm build

# Build specific app
pnpm build --filter=@webscada/frontend
pnpm build --filter=@webscada/backend

# Build only packages
pnpm build --filter=./packages/*
```

### Type Checking

```bash
# Type check all packages
pnpm type-check

# Type check specific package
pnpm type-check --filter=@webscada/backend
```

### Linting & Formatting

```bash
# Lint all packages (cached by Turbo)
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Clean Build Artifacts

```bash
# Clean all build outputs and caches
pnpm clean

# Clean and reinstall dependencies
pnpm clean && pnpm install
```

### Docker Development

```bash
# Build and start all services
pnpm docker:up

# Stop all services
pnpm docker:down
```

### K3s Deployment

```bash
# Deploy to K3s
pnpm k8s:deploy

# Or use Skaffold for development
skaffold dev
```

## Environment Variables

Create `.env.local` files in each app directory:

### Frontend (`apps/frontend/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Backend (`apps/backend/.env.local`)

```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/webscada
REDIS_URL=redis://localhost:6379
```

## Testing

```bash
pnpm test
```

## Documentation

All project documentation is organized in the `/documents` directory:

- **[Documentation Index](./documents/README.md)** - Complete documentation navigation
- **[Architecture](./documents/architecture/)** - System design and architecture
- **[Developer Guides](./documents/developer-guides/)** - Setup, coding standards, and contribution guidelines
- **[API Documentation](./documents/api/)** - API endpoints and authentication
- **[Operations](./documents/operations/)** - Deployment, backup, and infrastructure management
- **[User Guides](./documents/user-guides/)** - Frontend usage and features
- **[Migrations](./documents/migrations/)** - Change history and migration notes

For AI assistant onboarding, see [CLAUDE.md](./claude.md).

## Contributing

This project uses conventional commits. Please ensure your commit messages follow the format:

```
type(scope): subject

body

footer
```

## License

MIT
