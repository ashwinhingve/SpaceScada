# WebSCADA Deployment Checklist

This checklist ensures a smooth deployment of the WebSCADA system to production.

## Pre-Deployment Checklist

### 1. Code Quality & Testing
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code review completed
- [ ] No console.log statements in production code
- [ ] All TODO comments addressed or documented

### 2. Configuration Files
- [ ] `.env` files configured for production
- [ ] Database credentials updated
- [ ] Redis connection strings configured
- [ ] API keys and secrets set (Google Maps, etc.)
- [ ] CORS origins configured correctly
- [ ] JWT secrets generated (if using authentication)

### 3. Environment Variables

#### Backend (`apps/backend/.env`)
```bash
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
```

#### Frontend (`apps/frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
NODE_ENV=production
```

### 4. Database Setup
- [ ] PostgreSQL 16 installed and running
- [ ] Database created
- [ ] Database migrations applied
- [ ] Database backups configured
- [ ] Connection pooling configured
- [ ] SSL/TLS enabled for database connections

### 5. Redis Setup
- [ ] Redis 7 installed and running
- [ ] Persistence enabled (AOF/RDB)
- [ ] Memory limits configured
- [ ] Password authentication enabled
- [ ] Redis backups configured

### 6. Security
- [ ] HTTPS/TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Secrets stored securely (not in git)
- [ ] Security headers configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

## Docker Deployment

### Option 1: Docker Compose (Simple Deployment)

#### Build Images
```bash
# Build all images
docker-compose -f docker-compose.production.yml build

# Or build individually
docker build -f infrastructure/docker/backend.Dockerfile -t webscada/backend:latest .
docker build -f infrastructure/docker/frontend.Dockerfile -t webscada/frontend:latest .
docker build -f infrastructure/docker/simulator.Dockerfile -t webscada/simulator:latest .
```

#### Deploy
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop services
docker-compose -f docker-compose.production.yml down
```

#### Post-Deployment Checks
- [ ] All containers running
- [ ] Health checks passing
- [ ] Database connections working
- [ ] Redis connections working
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] WebSocket connections working

## Kubernetes/K3s Deployment

### Prerequisites
- [ ] K3s or Kubernetes cluster running
- [ ] kubectl configured
- [ ] Docker images pushed to registry
- [ ] Persistent volumes configured
- [ ] Load balancer configured (MetalLB for K3s)

### Deployment Steps

#### 1. Create Namespace
```bash
kubectl apply -f infrastructure/k3s/manifests/namespace.yaml
```

#### 2. Create ConfigMaps and Secrets
```bash
# Create secrets (DO NOT commit these to git)
kubectl create secret generic backend-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=REDIS_URL="redis://..." \
  --from-literal=JWT_SECRET="your-secret" \
  -n webscada

kubectl create secret generic frontend-secrets \
  --from-literal=NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-key" \
  -n webscada
```

#### 3. Deploy Database and Redis
```bash
kubectl apply -f infrastructure/k3s/manifests/postgres-deployment.yaml
kubectl apply -f infrastructure/k3s/manifests/redis-deployment.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n webscada --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n webscada --timeout=300s
```

#### 4. Deploy Applications
```bash
# Deploy backend
kubectl apply -f infrastructure/k3s/manifests/backend-deployment.yaml

# Deploy frontend
kubectl apply -f infrastructure/k3s/manifests/frontend-deployment.yaml

# Deploy realtime service
kubectl apply -f infrastructure/k3s/manifests/realtime-service-deployment.yaml

# Deploy simulator (optional)
kubectl apply -f infrastructure/k3s/manifests/simulator-deployment.yaml
```

#### 5. Deploy Ingress
```bash
kubectl apply -f infrastructure/k3s/manifests/ingress.yaml
```

#### 6. Verify Deployment
```bash
# Check all pods
kubectl get pods -n webscada

# Check services
kubectl get svc -n webscada

# Check ingress
kubectl get ingress -n webscada

# View logs
kubectl logs -f deployment/backend -n webscada
kubectl logs -f deployment/frontend -n webscada
```

### Post-Deployment Verification
- [ ] All pods running (2/2 ready)
- [ ] Services have endpoints
- [ ] Ingress configured with correct domain
- [ ] Health checks passing
- [ ] Application accessible via ingress
- [ ] Database connections working
- [ ] WebSocket connections working
- [ ] GIS maps loading correctly

## Monitoring Setup

### Prometheus & Grafana
```bash
# Deploy monitoring stack
kubectl apply -f infrastructure/k3s/manifests/monitoring/

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Default credentials: admin/admin (change immediately)
```

### Key Metrics to Monitor
- [ ] CPU usage
- [ ] Memory usage
- [ ] Request latency
- [ ] Error rates
- [ ] Database connections
- [ ] Redis connections
- [ ] WebSocket connections

## Backup Configuration

### Database Backups
```bash
# Automated backup script (run daily via cron)
kubectl exec -n webscada postgres-0 -- pg_dump -U webscada webscada > backup-$(date +%Y%m%d).sql
```

### Configuration Backups
- [ ] Kubernetes manifests backed up
- [ ] ConfigMaps exported
- [ ] Secrets documented (securely)

## Rollback Procedure

### Docker Compose
```bash
# Stop current version
docker-compose -f docker-compose.production.yml down

# Start previous version
docker-compose -f docker-compose.production.yml up -d
```

### Kubernetes
```bash
# Rollback deployment
kubectl rollout undo deployment/backend -n webscada
kubectl rollout undo deployment/frontend -n webscada

# Check rollout status
kubectl rollout status deployment/backend -n webscada
```

## Troubleshooting

### Common Issues

#### Frontend not loading
- Check NEXT_PUBLIC_API_URL environment variable
- Verify API is accessible
- Check browser console for errors
- Verify CORS configuration

#### Backend API errors
- Check database connection
- Verify Redis connection
- Check environment variables
- Review application logs

#### WebSocket connection failures
- Verify WebSocket URL (ws:// or wss://)
- Check firewall rules
- Verify proxy/ingress WebSocket support

#### Database connection issues
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Verify network connectivity
- Check connection pool limits

### Log Collection
```bash
# Docker Compose
docker-compose -f docker-compose.production.yml logs -f > logs.txt

# Kubernetes
kubectl logs deployment/backend -n webscada --tail=1000 > backend-logs.txt
kubectl logs deployment/frontend -n webscada --tail=1000 > frontend-logs.txt
```

## Performance Tuning

### Frontend
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable gzip/brotli compression

### Backend
- [ ] Configure connection pooling
- [ ] Enable Redis caching
- [ ] Set up rate limiting
- [ ] Configure worker processes

### Database
- [ ] Create appropriate indexes
- [ ] Configure autovacuum
- [ ] Set up connection pooling
- [ ] Monitor slow queries

## Scaling

### Horizontal Scaling
```bash
# Scale frontend
kubectl scale deployment frontend --replicas=4 -n webscada

# Scale backend
kubectl scale deployment backend --replicas=3 -n webscada
```

### Vertical Scaling
Edit deployment YAML files to adjust resource limits:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Maintenance Windows

### Recommended Maintenance Schedule
- **Daily**: Log review, backup verification
- **Weekly**: Security updates, dependency updates
- **Monthly**: Performance review, capacity planning
- **Quarterly**: Disaster recovery testing

## Support Contacts

- **DevOps Team**: devops@your-company.com
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.your-domain.com

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2025-11-26 | Initial production deployment checklist |

---

**Last Updated**: 2025-11-26
**Maintained By**: DevOps Team
