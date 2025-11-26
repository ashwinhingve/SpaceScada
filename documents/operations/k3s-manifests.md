# WebSCADA K3s Deployment Guide

This directory contains K3s manifests and deployment configurations for the WebSCADA MVP system.

## Directory Structure

```
infrastructure/k3s/manifests/
├── base/                          # Base configurations
│   ├── backend-config.yaml        # Backend ConfigMap
│   ├── backend-secrets.yaml       # Backend Secrets (use SealedSecrets in prod)
│   ├── frontend-config.yaml       # Frontend ConfigMap
│   └── postgres-config.yaml       # PostgreSQL ConfigMap and Secret
├── monitoring/                    # Monitoring configurations
│   ├── servicemonitor.yaml        # Prometheus ServiceMonitor
│   ├── grafana-dashboard.json     # Grafana dashboard definition
│   └── grafana-configmap.yaml     # Grafana ConfigMap
├── backend-deployment.yaml        # Backend deployment with HA
├── frontend-deployment.yaml       # Frontend deployment
├── postgres-deployment.yaml       # PostgreSQL StatefulSet
├── redis-deployment.yaml          # Redis deployment
├── ingress.yaml                   # Nginx Ingress with WebSocket support
├── namespace.yaml                 # Namespace definition
└── README.md                      # This file
```

## Prerequisites

- K3s cluster (v1.24+)
- kubectl configured
- Helm 3.x (for PostgreSQL and Redis)
- Skaffold (optional, for development)
- Prometheus Operator (optional, for monitoring)

## Quick Start

### 1. Deploy with Skaffold (Development)

```bash
# Install all components
skaffold dev

# Or use specific profile
skaffold dev --profile=dev
```

### 2. Deploy with deploy.sh Script

```bash
# Install Helm dependencies (PostgreSQL, Redis)
./deploy.sh helm-deps -n webscada

# Fresh installation
./deploy.sh install -n webscada

# Check status
./deploy.sh status -n webscada

# Upgrade
./deploy.sh upgrade -n webscada

# Rollback
./deploy.sh rollback -n webscada

# Cleanup
./deploy.sh cleanup -n webscada
```

### 3. Manual Deployment

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Deploy PostgreSQL using Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgresql bitnami/postgresql \
  -f ../helm/values/postgresql-values.yaml \
  -n webscada

# Deploy Redis using Helm
helm install redis bitnami/redis \
  -f ../helm/values/redis-values.yaml \
  -n webscada

# Deploy ConfigMaps and Secrets
kubectl apply -f base/ -n webscada

# Deploy application components
kubectl apply -f backend-deployment.yaml -n webscada
kubectl apply -f frontend-deployment.yaml -n webscada
kubectl apply -f ingress.yaml -n webscada

# Deploy monitoring (if Prometheus Operator is installed)
kubectl apply -f monitoring/servicemonitor.yaml -n webscada
```

## Component Details

### Backend Deployment

**File:** `backend-deployment.yaml`

Features:

- **High Availability**: 2 replicas with anti-affinity rules
- **Resource Limits**: 200m CPU, 256Mi memory
- **Health Probes**: Liveness and readiness probes on `/health`
- **Session Affinity**: ClientIP session affinity for WebSocket connections
- **Auto-scaling**: HPA configured (min: 2, max: 10)

### Frontend Deployment

**File:** `frontend-deployment.yaml`

Features:

- **2 Replicas**: Anti-affinity for distribution
- **Resource Limits**: 100m CPU, 128Mi memory
- **Cache Volume**: EmptyDir for Next.js cache
- **Health Probes**: On `/api/health`

### Ingress Configuration

**File:** `ingress.yaml`

Features:

- **WebSocket Support**: Proper upgrade headers and timeouts
- **SSL/TLS**: Cert-manager integration
- **Rate Limiting**: 100 RPS, 10 concurrent connections
- **CORS**: Enabled with proper headers
- **Routing**:
  - `/api/*` → Backend
  - `/socket.io/*` → Backend (WebSocket)
  - `/*` → Frontend

### PostgreSQL (Helm)

**Values:** `../helm/values/postgresql-values.yaml`

Configuration:

- **Resources**: 500m CPU, 512Mi memory (scalable to 1Gi)
- **Storage**: 10Gi persistent volume
- **Optimized for SCADA**: Custom PostgreSQL tuning
- **Metrics**: Prometheus exporter enabled
- **Backups**: Configured via Helm values

### Redis (Helm)

**Values:** `../helm/values/redis-values.yaml`

Configuration:

- **Architecture**: Standalone (use replication for HA in prod)
- **Resources**: 100m CPU, 128Mi memory
- **Storage**: 5Gi for persistence
- **Caching**: LRU eviction policy, 200MB max memory
- **Metrics**: Prometheus exporter enabled

## Monitoring

### ServiceMonitor

**File:** `monitoring/servicemonitor.yaml`

Prometheus scraping configuration for:

- Backend metrics (`/metrics`)
- Frontend metrics (`/api/metrics`)
- Pod-level metrics

### Grafana Dashboard

**File:** `monitoring/grafana-dashboard.json`

Pre-configured dashboard with panels for:

- CPU and memory usage
- Pod availability
- HTTP request metrics
- WebSocket connections
- Database connections

### Alerts

Configured alerts:

- Pod down (Critical)
- High CPU/Memory usage (Warning)
- PostgreSQL/Redis connectivity (Critical/Warning)
- Frequent pod restarts (Warning)
- High WebSocket connections (Info)

## Configuration Management

### ConfigMaps

Located in `base/` directory:

- `backend-config.yaml`: Application settings, CORS, WebSocket config
- `frontend-config.yaml`: API URLs, app metadata
- `postgres-config.yaml`: Database tuning parameters

### Secrets

**Development:** Plain K3s Secrets in `base/backend-secrets.yaml`

**Production:** Use SealedSecrets:

```bash
# Install Sealed Secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create sealed secret
kubeseal -f base/backend-secrets.yaml -w base/backend-sealed-secrets.yaml

# Apply sealed secret
kubectl apply -f base/backend-sealed-secrets.yaml -n webscada
```

## Networking

### Service Mesh (Optional)

For production, consider using Istio or Linkerd:

```bash
# Install Istio
istioctl install --set profile=default

# Enable sidecar injection
kubectl label namespace webscada istio-injection=enabled
```

### Network Policies

Create network policies to restrict pod-to-pod communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: webscada-dev
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 3001
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n webscada
kubectl describe pod <pod-name> -n webscada
kubectl logs <pod-name> -n webscada
```

### Check Deployment Status

```bash
kubectl get deployments -n webscada
kubectl rollout status deployment/backend -n webscada
```

### Check Service Endpoints

```bash
kubectl get endpoints -n webscada
```

### Port Forward for Local Testing

```bash
# Frontend
kubectl port-forward svc/frontend 3000:3000 -n webscada

# Backend
kubectl port-forward svc/backend 3001:3001 -n webscada

# PostgreSQL
kubectl port-forward svc/postgresql 5432:5432 -n webscada

# Redis
kubectl port-forward svc/redis 6379:6379 -n webscada
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n webscada

# Frontend logs
kubectl logs -f deployment/frontend -n webscada

# All pods with label
kubectl logs -f -l app=backend -n webscada
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/backend -n webscada

# Rollback to previous version
kubectl rollout undo deployment/backend -n webscada

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n webscada
```

## Performance Tuning

### Horizontal Pod Autoscaler (HPA)

HPA is configured for the backend:

```yaml
minReplicas: 2
maxReplicas: 10
metrics:
  - CPU: 70%
  - Memory: 80%
```

Monitor HPA:

```bash
kubectl get hpa -n webscada
kubectl describe hpa backend-hpa -n webscada
```

### Vertical Pod Autoscaler (VPA)

Install VPA for automatic resource optimization:

```bash
git clone https://github.com/k3s/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-up.sh
```

## Security Best Practices

1. **Use SealedSecrets** for sensitive data in Git
2. **Enable RBAC** with least privilege
3. **Use Network Policies** to restrict traffic
4. **Enable Pod Security Standards**
5. **Regular security scanning** with tools like Trivy
6. **Keep images updated** and scan for vulnerabilities
7. **Use non-root containers** when possible
8. **Enable audit logging**

## Production Checklist

- [ ] Use SealedSecrets for all sensitive data
- [ ] Configure proper resource limits
- [ ] Enable monitoring and alerting
- [ ] Set up log aggregation (EFK/Loki)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Enable network policies
- [ ] Use Ingress with proper TLS certificates
- [ ] Configure HPA for auto-scaling
- [ ] Set up disaster recovery plan
- [ ] Document runbooks for common issues
- [ ] Enable Pod Disruption Budgets
- [ ] Configure proper RBAC roles
- [ ] Use dedicated node pools for databases

## Additional Resources

- [K3s Best Practices](https://k3s.io/docs/concepts/configuration/overview/)
- [Helm Documentation](https://helm.sh/docs/)
- [Skaffold Documentation](https://skaffold.dev/docs/)
- [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
