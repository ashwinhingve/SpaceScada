# WebSCADA Deployment Guide

Complete guide for deploying the WebSCADA system to production environments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Build Configuration](#build-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes/K3s Deployment](#kubernetesk3s-deployment)
6. [Environment Configuration](#environment-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

## Overview

WebSCADA is a monorepo-based industrial IoT platform with the following components:

- **Frontend**: Next.js 14 application (Port 3000)
- **Backend**: Fastify API server (Port 3001)
- **Realtime Service**: WebSocket server (Port 3002)
- **Simulator**: Device simulator (Port 3003)
- **PostgreSQL**: Database (Port 5432)
- **Redis**: Cache (Port 6379)
- **MQTT Broker**: Mosquitto (Ports 1883, 9001)

## Prerequisites

### System Requirements

**Minimum**:
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB
- OS: Ubuntu 20.04+ / Debian 11+ / RHEL 8+

**Recommended**:
- CPU: 8 cores
- RAM: 16 GB
- Storage: 100 GB SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

```bash
# Node.js 18+
node --version  # >= 18.0.0

# pnpm 8+
pnpm --version  # >= 8.0.0

# Docker & Docker Compose
docker --version  # >= 24.0.0
docker-compose --version  # >= 2.20.0

# Kubernetes (for K3s deployment)
kubectl version  # >= 1.27.0
```

## Build Configuration

### 1. Verify Configuration Files

All configuration files have been updated and are ready for deployment:

```bash
# Root configuration
✓ .gitignore - Updated with comprehensive ignore patterns
✓ tsconfig.json - Root TypeScript configuration
✓ package.json - Workspace scripts and dependencies
✓ turbo.json - Build pipeline configuration
✓ pnpm-workspace.yaml - Workspace packages definition

# Code quality
✓ .eslintrc.js - ESLint configuration
✓ .prettierrc.js - Prettier configuration
✓ .prettierignore - Prettier ignore patterns
✓ commitlint.config.js - Commit message linting

# Docker
✓ docker-compose.yml - Development environment
✓ docker-compose.production.yml - Production environment
✓ infrastructure/docker/backend.Dockerfile - Backend container
✓ infrastructure/docker/frontend.Dockerfile - Frontend container
✓ infrastructure/docker/simulator.Dockerfile - Simulator container

# Kubernetes/K3s
✓ infrastructure/k3s/manifests/* - K3s deployment manifests
```

### 2. Environment Variables

Copy example files and configure:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with production values

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit apps/frontend/.env.local with production values

# Realtime Service
cp apps/realtime-service/.env.example apps/realtime-service/.env
```

**Critical Variables to Configure**:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXT_PUBLIC_API_URL`: Frontend API endpoint
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `CORS_ORIGIN`: Allowed frontend domain
- `JWT_SECRET`: Secret for JWT tokens (if using auth)

### 3. Build Applications

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Type check
pnpm type-check

# Lint code
pnpm lint

# Run tests
pnpm test
```

## Docker Deployment

### Quick Start (Development)

```bash
# Start databases only
docker-compose up -d postgres redis mosquitto

# Start application in development
pnpm dev
```

### Production Deployment

#### Step 1: Build Images

```bash
# Build all images
docker-compose -f docker-compose.production.yml build

# Or build individually with tags
docker build -f infrastructure/docker/backend.Dockerfile -t webscada/backend:v1.0.0 .
docker build -f infrastructure/docker/frontend.Dockerfile -t webscada/frontend:v1.0.0 .
docker build -f infrastructure/docker/simulator.Dockerfile -t webscada/simulator:v1.0.0 .
```

#### Step 2: Push to Registry (Optional)

```bash
# Tag images for your registry
docker tag webscada/backend:v1.0.0 your-registry.com/webscada/backend:v1.0.0
docker tag webscada/frontend:v1.0.0 your-registry.com/webscada/frontend:v1.0.0

# Push to registry
docker push your-registry.com/webscada/backend:v1.0.0
docker push your-registry.com/webscada/frontend:v1.0.0
```

#### Step 3: Deploy

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check status
docker-compose -f docker-compose.production.yml ps
```

#### Step 4: Verify Deployment

```bash
# Check frontend
curl http://localhost:3000

# Check backend health
curl http://localhost:3001/health

# Check database
docker exec webscada-postgres psql -U webscada -c "SELECT version();"

# Check Redis
docker exec webscada-redis redis-cli ping
```

### Docker Compose Commands

```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# Stop services
docker-compose -f docker-compose.production.yml down

# Restart a specific service
docker-compose -f docker-compose.production.yml restart backend

# View logs
docker-compose -f docker-compose.production.yml logs -f backend

# Scale services
docker-compose -f docker-compose.production.yml up -d --scale backend=3

# Remove everything (including volumes)
docker-compose -f docker-compose.production.yml down -v
```

## Kubernetes/K3s Deployment

### Installation (K3s)

```bash
# Install K3s
curl -sfL https://get.k3s.io | sh -

# Check installation
sudo k3s kubectl get nodes

# Copy kubeconfig for regular user
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config
```

### Deployment Steps

#### 1. Create Namespace

```bash
kubectl apply -f infrastructure/k3s/manifests/namespace.yaml
```

#### 2. Create Secrets

```bash
# Database credentials
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD=your-secure-password \
  --namespace=webscada

# Backend secrets
kubectl create secret generic backend-secrets \
  --from-literal=DATABASE_URL="postgresql://webscada:password@postgres:5432/webscada" \
  --from-literal=REDIS_URL="redis://redis:6379" \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  --namespace=webscada

# Frontend secrets
kubectl create secret generic frontend-secrets \
  --from-literal=NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-maps-key" \
  --namespace=webscada
```

#### 3. Deploy Infrastructure

```bash
# PostgreSQL
kubectl apply -f infrastructure/k3s/manifests/postgres-deployment.yaml

# Redis
kubectl apply -f infrastructure/k3s/manifests/redis-deployment.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n webscada --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n webscada --timeout=300s
```

#### 4. Deploy Applications

```bash
# Backend
kubectl apply -f infrastructure/k3s/manifests/backend-deployment.yaml

# Frontend
kubectl apply -f infrastructure/k3s/manifests/frontend-deployment.yaml

# Realtime Service
kubectl apply -f infrastructure/k3s/manifests/realtime-service-deployment.yaml

# Simulator (optional)
kubectl apply -f infrastructure/k3s/manifests/simulator-deployment.yaml
```

#### 5. Deploy Ingress

```bash
kubectl apply -f infrastructure/k3s/manifests/ingress.yaml
```

#### 6. Verify Deployment

```bash
# Check pods
kubectl get pods -n webscada

# Expected output:
# NAME                         READY   STATUS    RESTARTS   AGE
# backend-xxx                  1/1     Running   0          2m
# frontend-xxx                 1/1     Running   0          2m
# postgres-0                   1/1     Running   0          5m
# redis-xxx                    1/1     Running   0          5m

# Check services
kubectl get svc -n webscada

# Check ingress
kubectl get ingress -n webscada

# View logs
kubectl logs -f deployment/backend -n webscada
```

### Kubernetes Management

```bash
# Scale deployments
kubectl scale deployment frontend --replicas=4 -n webscada
kubectl scale deployment backend --replicas=3 -n webscada

# Update deployment
kubectl set image deployment/backend backend=webscada/backend:v1.1.0 -n webscada

# Rollback deployment
kubectl rollout undo deployment/backend -n webscada

# Check rollout status
kubectl rollout status deployment/backend -n webscada

# Restart deployment
kubectl rollout restart deployment/frontend -n webscada

# Delete resources
kubectl delete -f infrastructure/k3s/manifests/backend-deployment.yaml
```

## Environment Configuration

### Production Environment Variables

#### Backend (`apps/backend/.env`)

```bash
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Database
DATABASE_URL=postgresql://webscada:SECURE_PASSWORD@postgres.example.com:5432/webscada?sslmode=require
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis
REDIS_URL=redis://:SECURE_PASSWORD@redis.example.com:6379
REDIS_TTL=3600

# CORS
CORS_ORIGIN=https://webscada.example.com

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# JWT (if using authentication)
JWT_SECRET=your-very-long-random-secret-key
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
```

#### Frontend (`apps/frontend/.env.local`)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.webscada.example.com
NEXT_PUBLIC_WS_URL=wss://api.webscada.example.com

# Environment
NODE_ENV=production

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Feature Flags
NEXT_PUBLIC_ENABLE_GIS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Analytics (optional)
NEXT_PUBLIC_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

## SSL/TLS Setup

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d webscada.example.com -d api.webscada.example.com

# Auto-renewal (already configured by Certbot)
sudo certbot renew --dry-run
```

### Using Kubernetes Cert-Manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f infrastructure/k3s/manifests/base/cert-manager-issuer.yaml

# Update ingress to use cert-manager
# (Already configured in ingress.yaml)
```

## Monitoring & Logging

### Prometheus & Grafana Setup

```bash
# Deploy monitoring stack
kubectl apply -f infrastructure/k3s/manifests/monitoring/

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Login: admin/admin (change immediately)
```

### Application Logs

```bash
# Docker
docker-compose -f docker-compose.production.yml logs -f

# Kubernetes
kubectl logs -f deployment/backend -n webscada
kubectl logs -f deployment/frontend -n webscada

# Save logs to file
kubectl logs deployment/backend -n webscada --tail=10000 > backend-logs.txt
```

### Metrics to Monitor

- **Application**:
  - Request rate
  - Response time
  - Error rate
  - Active connections

- **System**:
  - CPU usage
  - Memory usage
  - Disk I/O
  - Network traffic

- **Database**:
  - Connection count
  - Query performance
  - Cache hit rate
  - Replication lag

## Backup & Recovery

### Database Backups

```bash
# Manual backup (Docker)
docker exec webscada-postgres pg_dump -U webscada webscada > backup-$(date +%Y%m%d).sql

# Manual backup (Kubernetes)
kubectl exec -n webscada postgres-0 -- pg_dump -U webscada webscada > backup-$(date +%Y%m%d).sql

# Restore from backup
docker exec -i webscada-postgres psql -U webscada webscada < backup.sql
# or
kubectl exec -i -n webscada postgres-0 -- psql -U webscada webscada < backup.sql
```

### Automated Backup Script

Create `/etc/cron.daily/webscada-backup`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/webscada"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker exec webscada-postgres pg_dump -U webscada webscada | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# Backup Redis
docker exec webscada-redis redis-cli SAVE
docker cp webscada-redis:/data/dump.rdb "$BACKUP_DIR/redis-$DATE.rdb"

# Keep only last 7 days
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "redis-*.rdb" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

#### 1. Frontend Cannot Connect to Backend

**Symptoms**:
- Frontend loads but shows "Network Error"
- API requests fail

**Solutions**:
```bash
# Check backend is running
curl http://localhost:3001/health

# Check CORS configuration
# Verify CORS_ORIGIN in backend .env matches frontend domain

# Check network connectivity
docker exec webscada-frontend ping backend
# or
kubectl exec -n webscada frontend-xxx -- ping backend
```

#### 2. Database Connection Errors

**Symptoms**:
- Backend crashes on startup
- "Connection refused" errors

**Solutions**:
```bash
# Verify DATABASE_URL format
# Format: postgresql://user:password@host:5432/database

# Check PostgreSQL is running
docker ps | grep postgres
# or
kubectl get pods -l app=postgres -n webscada

# Test connection
docker exec webscada-backend psql "$DATABASE_URL" -c "SELECT 1"
```

#### 3. WebSocket Connection Failures

**Symptoms**:
- Real-time updates not working
- WebSocket connection errors in console

**Solutions**:
```bash
# Check WebSocket URL format
# Development: ws://localhost:3001
# Production: wss://api.example.com

# Verify proxy/ingress supports WebSocket
# Nginx: proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade;
```

#### 4. Memory Issues

**Symptoms**:
- Container restarts frequently
- OOM (Out of Memory) errors

**Solutions**:
```bash
# Increase memory limits (Docker Compose)
# Edit docker-compose.production.yml:
services:
  backend:
    mem_limit: 1g

# Increase memory limits (Kubernetes)
# Edit deployment YAML:
resources:
  limits:
    memory: "1Gi"
```

### Debug Commands

```bash
# Check container logs
docker logs webscada-backend --tail=100 -f

# Execute commands in container
docker exec -it webscada-backend sh

# Check Kubernetes events
kubectl get events -n webscada --sort-by='.lastTimestamp'

# Describe pod for details
kubectl describe pod backend-xxx -n webscada

# Check resource usage
docker stats
# or
kubectl top pods -n webscada
```

## Performance Optimization

### Frontend Optimization

1. **Enable CDN**: Serve static assets from CDN
2. **Image Optimization**: Use Next.js Image component
3. **Code Splitting**: Automatic with Next.js
4. **Caching**: Configure cache headers

### Backend Optimization

1. **Connection Pooling**: Configure database pool size
2. **Redis Caching**: Cache frequent queries
3. **Rate Limiting**: Prevent abuse
4. **Compression**: Enable gzip/brotli

### Database Optimization

```sql
-- Create indexes for frequent queries
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_tags_device_id ON tags(device_id);
CREATE INDEX idx_alarms_created_at ON alarms(created_at);

-- Configure autovacuum
ALTER TABLE devices SET (autovacuum_vacuum_scale_factor = 0.05);
```

## Scaling Guidelines

### Horizontal Scaling

```bash
# Docker Compose
docker-compose -f docker-compose.production.yml up -d --scale backend=3 --scale frontend=2

# Kubernetes
kubectl scale deployment backend --replicas=3 -n webscada
kubectl scale deployment frontend --replicas=2 -n webscada
```

### Load Testing

```bash
# Install k6
sudo apt-get install k6

# Run load test
k6 run tests/load/api-test.js
```

## Support

For issues or questions:
- **Documentation**: `/documents` directory
- **GitHub Issues**: https://github.com/your-org/webscada/issues
- **Email**: support@your-company.com

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
