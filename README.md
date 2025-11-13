# WebSCADA System

A modern, cloud-native SCADA (Supervisory Control and Data Acquisition) system built with a microservices architecture.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Fastify, TypeScript
- **Real-time**: Socket.io
- **Database**: PostgreSQL, Redis
- **Container**: Docker
- **Orchestration**: Kubernetes

## Project Structure

```
webscada-system/
├── apps/
│   ├── frontend/       # Next.js web application
│   ├── backend/        # Fastify API server
│   └── simulator/      # Device simulator for testing
├── packages/
│   ├── shared-types/   # Shared TypeScript types
│   ├── utils/          # Common utilities
│   └── protocols/      # Protocol implementations (Modbus, OPC-UA, etc.)
├── infrastructure/
│   ├── k8s/           # Kubernetes manifests
│   ├── docker/        # Dockerfiles
│   └── helm/          # Helm charts
└── scripts/           # Build and deployment scripts
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- Kubernetes cluster (for production deployment)

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @webscada/frontend dev
pnpm --filter @webscada/backend dev
pnpm --filter @webscada/simulator dev
```

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @webscada/frontend build
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Docker Development

```bash
# Build and start all services
pnpm docker:up

# Stop all services
pnpm docker:down
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
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

## Contributing

This project uses conventional commits. Please ensure your commit messages follow the format:

```
type(scope): subject

body

footer
```

## License

MIT
