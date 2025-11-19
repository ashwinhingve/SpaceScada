# WebSCADA Deployment Guide

This guide covers various deployment methods for the WebSCADA system.

## Table of Contents

- [Local Development](#local-development)
- [Docker Compose](#docker-compose)
- [Kubernetes](#kubernetes)
- [Helm Charts](#helm-charts)
- [Skaffold](#skaffold)
- [Production Considerations](#production-considerations)

## Local Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL 16
- Redis 7

### Setup

1. **Install dependencies**

   ```bash
   ./scripts/dev-setup.sh
   ```

2. **Start databases** (if not using Docker)

   ```bash
   # PostgreSQL
   psql -U postgres -f infrastructure/docker/init-db.sql

   # Redis
   redis-server
   ```

3. **Configure environment**

   ```bash
   # Frontend
   cp apps/frontend/.env.example apps/frontend/.env.local

   # Backend
   cp apps/backend/.env.example apps/backend/.env.local

   # Simulator
   cp apps/simulator/.env.example apps/simulator/.env.local
   ```

4. **Start development servers**

   ```bash
   # All services
   pnpm dev

   # Individual services
   pnpm --filter @webscada/frontend dev
   pnpm --filter @webscada/backend dev
   pnpm --filter @webscada/simulator dev
   ```

## Docker Compose

The easiest way to run the entire stack locally.

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove all data
docker-compose down -v
```

### Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Simulator**: Port 5020 (Modbus TCP)
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379

### Custom Configuration

Create `docker-compose.override.yml` for local customizations:

```yaml
version: '3.8'

services:
  backend:
    environment:
      LOG_LEVEL: debug
```

## Kubernetes

Deploy to a Kubernetes cluster using raw manifests.

### Prerequisites

- kubectl configured with cluster access
- Cluster with at least 3 nodes (recommended)
- Storage class for PersistentVolumes

### Deployment

1. **Build and push images**

   ```bash
   export REGISTRY=your-registry.io
   export VERSION=1.0.0
   ./scripts/build-images.sh
   ```

2. **Update image references**
   Edit the image names in `infrastructure/k8s/*-deployment.yaml` to match your registry.

3. **Deploy**

   ```bash
   ./scripts/k8s-deploy.sh
   ```

4. **Verify deployment**

   ```bash
   kubectl get pods -n webscada
   kubectl get services -n webscada
   ```

5. **Access services**

   ```bash
   # Port forward frontend
   kubectl port-forward service/frontend 3000:3000 -n webscada

   # Port forward backend
   kubectl port-forward service/backend 3001:3001 -n webscada
   ```

### Cleanup

```bash
./scripts/k8s-cleanup.sh
```

## Helm Charts

Deploy using Helm for easier management and configuration.

### Installation

1. **Install Helm chart**

   ```bash
   helm install webscada ./infrastructure/helm/webscada \
     --namespace webscada \
     --create-namespace
   ```

2. **Custom values**

   ```bash
   helm install webscada ./infrastructure/helm/webscada \
     --namespace webscada \
     --create-namespace \
     --values custom-values.yaml
   ```

3. **Upgrade**

   ```bash
   helm upgrade webscada ./infrastructure/helm/webscada \
     --namespace webscada
   ```

4. **Uninstall**
   ```bash
   helm uninstall webscada --namespace webscada
   ```

### Custom Values Example

```yaml
# custom-values.yaml
frontend:
  replicaCount: 3
  resources:
    requests:
      memory: '512Mi'
      cpu: '500m'

backend:
  autoscaling:
    minReplicas: 3
    maxReplicas: 20

ingress:
  enabled: true
  hosts:
    - host: scada.yourdomain.com
```

## Skaffold

For rapid development with Kubernetes.

### Prerequisites

- Skaffold installed
- Local Kubernetes cluster (minikube, kind, or Docker Desktop)

### Development Mode

```bash
# Continuous development
skaffold dev

# Run once and exit
skaffold run

# Debug mode
skaffold debug
```

Skaffold will:

- Build Docker images
- Deploy to Kubernetes
- Stream logs
- Auto-rebuild on file changes
- Port-forward services

### Production Deployment

```bash
skaffold run -p prod
```

## Production Considerations

### Security

1. **Secrets Management**
   - Use Kubernetes Secrets or external secret managers (Vault, AWS Secrets Manager)
   - Never commit secrets to version control
   - Rotate secrets regularly

2. **Network Security**
   - Enable TLS/SSL for all services
   - Use Network Policies to restrict traffic
   - Implement proper CORS settings

3. **Authentication**
   - Implement proper user authentication
   - Use JWT tokens with appropriate expiration
   - Enable rate limiting

### Performance

1. **Database**
   - Configure connection pooling
   - Set up read replicas for scaling
   - Regular backups and point-in-time recovery

2. **Caching**
   - Use Redis for frequently accessed data
   - Implement CDN for static assets
   - Enable HTTP caching headers

3. **Scaling**
   - Configure HPA (Horizontal Pod Autoscaler)
   - Use cluster autoscaling
   - Monitor resource usage

### Monitoring

1. **Logging**
   - Centralized logging (ELK, Loki, CloudWatch)
   - Structured logging format
   - Log retention policies

2. **Metrics**
   - Prometheus for metrics collection
   - Grafana for visualization
   - Custom dashboards for SCADA metrics

3. **Alerting**
   - Set up alerts for critical events
   - Monitor service health
   - Track SLOs and SLIs

### High Availability

1. **Database**
   - PostgreSQL with replication
   - Regular automated backups
   - Disaster recovery plan

2. **Application**
   - Multiple replicas (minimum 3)
   - Pod disruption budgets
   - Health checks and probes

3. **Infrastructure**
   - Multi-zone deployment
   - Load balancing
   - Failover mechanisms

### Example Production Configuration

```yaml
# Production values
frontend:
  replicaCount: 3
  resources:
    requests:
      memory: '512Mi'
      cpu: '500m'
    limits:
      memory: '1Gi'
      cpu: '1000m'

backend:
  replicaCount: 5
  autoscaling:
    enabled: true
    minReplicas: 5
    maxReplicas: 20
    targetCPUUtilizationPercentage: 70

postgresql:
  persistence:
    enabled: true
    size: 100Gi
  replication:
    enabled: true
    replicas: 2

redis:
  persistence:
    enabled: true
    size: 20Gi
  replication:
    enabled: true

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
  tls:
    - secretName: webscada-tls
      hosts:
        - scada.production.com
```

## Troubleshooting

### Common Issues

1. **Pods not starting**

   ```bash
   kubectl describe pod <pod-name> -n webscada
   kubectl logs <pod-name> -n webscada
   ```

2. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Check if PostgreSQL pod is running
   - Test connection from backend pod

3. **Image pull errors**
   - Verify image exists in registry
   - Check image pull secrets
   - Confirm registry credentials

### Useful Commands

```bash
# Get all resources
kubectl get all -n webscada

# Describe a resource
kubectl describe <resource-type> <resource-name> -n webscada

# Execute command in pod
kubectl exec -it <pod-name> -n webscada -- /bin/sh

# View events
kubectl get events -n webscada --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n webscada
kubectl top nodes
```
