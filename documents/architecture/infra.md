# Infrastructure Architecture

This document describes the infrastructure architecture, deployment topology, and cloud-native design of the WebSCADA system.

## Overview

WebSCADA is designed as a cloud-native, containerized application with Kubernetes as the primary orchestration platform. The architecture supports both on-premises and cloud deployments.

## Deployment Architecture

### Production Topology

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet / Edge                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │  Load Balancer  │ (Ingress Controller)
                └────────┬────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
   │ Frontend │    │ Frontend │    │ Frontend │
   │  Pod 1   │    │  Pod 2   │    │  Pod 3   │
   └──────────┘    └──────────┘    └──────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
   │ Backend  │    │ Backend  │    │ Backend  │
   │  Pod 1   │    │  Pod 2   │    │  Pod 3   │
   └──────────┘    └──────────┘    └──────────┘
                         │
        ┌────────────────┼────────────────┬────────────┐
        │                │                │            │
   ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐ ┌────▼─────┐
   │PostgreSQL│    │  Redis   │    │InfluxDB  │ │ChirpStack│
   │(StatefulSet)│ │(StatefulSet)│ │(StatefulSet)│ │  Server  │
   └──────────┘    └──────────┘    └──────────┘ └──────────┘
```

## Infrastructure Components

### 1. Kubernetes Cluster

**Cluster Configuration:**
- **Production**: 3+ nodes (HA setup)
- **Development**: Minikube / Kind (single node)
- **Edge**: K3s (lightweight Kubernetes)

**Node Requirements:**
- **Master Node**: 2 CPU, 4GB RAM
- **Worker Nodes**: 4 CPU, 8GB RAM each
- **Storage**: 100GB+ per node

### 2. Container Orchestration

**Kubernetes Resources:**

```yaml
# Deployments (Stateless)
- Frontend (3 replicas)
- Backend (3 replicas)
- Realtime Service (2 replicas)
- Simulator (1 replica, dev only)

# StatefulSets (Stateful)
- PostgreSQL (1 primary, 2 replicas)
- Redis (3 replicas with Sentinel)
- InfluxDB (1 instance)

# Services
- Frontend (ClusterIP)
- Backend (ClusterIP)
- PostgreSQL (ClusterIP)
- Redis (ClusterIP)
- InfluxDB (ClusterIP)

# Ingress
- HTTP/HTTPS routing
- TLS termination
- Rate limiting
```

**Namespace Organization:**
```
webscada-prod       # Production environment
webscada-dev        # Development environment
webscada-staging    # Staging environment
monitoring          # Prometheus, Grafana
logging             # ELK stack
```

### 3. Container Registry

**Docker Images:**
```
registry.example.com/webscada/frontend:latest
registry.example.com/webscada/backend:latest
registry.example.com/webscada/realtime-service:latest
registry.example.com/webscada/simulator:latest
```

**Build Pipeline:**
1. Source code pushed to Git
2. CI/CD triggers (GitHub Actions)
3. Docker build with multi-stage Dockerfiles
4. Push to container registry
5. Kubernetes deployment update

### 4. Storage Architecture

**Persistent Volumes:**

```yaml
# PostgreSQL
- StorageClass: fast-ssd
- Size: 50Gi
- Access: ReadWriteOnce
- Backup: Daily snapshots

# Redis
- StorageClass: fast-ssd
- Size: 10Gi
- Access: ReadWriteOnce
- Persistence: AOF + RDB

# InfluxDB
- StorageClass: standard
- Size: 200Gi
- Access: ReadWriteOnce
- Retention: 90 days
```

**Storage Classes:**
- `fast-ssd`: SSD-backed storage for databases
- `standard`: HDD storage for logs and backups
- `local-path`: Local storage for development

### 5. Networking

**Service Mesh:**
- **Internal**: ClusterIP services
- **External**: LoadBalancer / NodePort
- **DNS**: CoreDNS for service discovery

**Network Policies:**
```yaml
# Allow Frontend → Backend
# Allow Backend → PostgreSQL, Redis, InfluxDB
# Deny all other traffic
```

**Ingress Configuration:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webscada-ingress
spec:
  rules:
  - host: scada.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port: 3000
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port: 3001
```

## Infrastructure as Code

### Kubernetes Manifests

Located in `infrastructure/k8s/`:

```
k8s/
├── base/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   └── secrets.yaml
├── frontend-deployment.yaml
├── backend-deployment.yaml
├── realtime-deployment.yaml
├── postgresql-statefulset.yaml
├── redis-statefulset.yaml
├── influxdb-statefulset.yaml
└── ingress.yaml
```

### Helm Charts

**Chart Structure:**
```
helm/
├── Chart.yaml
├── values.yaml
├── values-prod.yaml
├── values-dev.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    └── configmap.yaml
```

**Installation:**
```bash
# Install with Helm
helm install webscada ./helm -f ./helm/values-prod.yaml

# Upgrade
helm upgrade webscada ./helm -f ./helm/values-prod.yaml
```

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  influxdb:
    image: influxdb:2.7
    ports: ["8086:8086"]
    volumes:
      - influxdb-data:/var/lib/influxdb2
```

## High Availability (HA)

### Frontend HA
- **Replicas**: 3 pods across different nodes
- **Load Balancing**: Round-robin via Kubernetes Service
- **Health Checks**: Liveness and readiness probes
- **Autoscaling**: HPA based on CPU (50-70% target)

### Backend HA
- **Replicas**: 3 pods across different nodes
- **Session Management**: Stateless design (JWT tokens)
- **Database Connections**: Connection pooling (pg)
- **Autoscaling**: HPA based on CPU and custom metrics

### Database HA
- **PostgreSQL**: Primary + 2 read replicas
- **Redis**: Redis Sentinel (1 master, 2 replicas)
- **InfluxDB**: Single instance with daily backups

## Disaster Recovery

### Backup Strategy

**PostgreSQL:**
- Daily full backups (pg_dump)
- WAL archiving for point-in-time recovery
- Retention: 30 days

**Redis:**
- RDB snapshots every 6 hours
- AOF for durability
- Retention: 7 days

**InfluxDB:**
- Weekly full backups
- Retention: 90 days of data, 1 year of aggregates

### Recovery Procedures

1. **Database Restore**:
   ```bash
   # PostgreSQL
   kubectl exec -it postgresql-0 -- pg_restore -U webscada -d webscada /backups/backup.dump

   # Redis
   kubectl cp backup.rdb redis-0:/data/dump.rdb
   kubectl rollout restart statefulset/redis
   ```

2. **Application Rollback**:
   ```bash
   # Rollback to previous version
   kubectl rollout undo deployment/backend
   kubectl rollout undo deployment/frontend
   ```

## Monitoring and Observability

### Metrics (Prometheus)
- **System Metrics**: CPU, Memory, Disk, Network
- **Application Metrics**: Request rate, latency, errors
- **Database Metrics**: Connections, query performance
- **Custom Metrics**: Device count, telemetry rate

### Logging (Fluent Bit + Elasticsearch)
- **Application Logs**: Structured JSON logs
- **Access Logs**: Ingress and API access logs
- **Error Logs**: Exception tracking and alerts

### Tracing (Jaeger)
- **Distributed Tracing**: Request flow across services
- **Performance Analysis**: Identify bottlenecks
- **Dependency Mapping**: Service interaction visualization

### Dashboards (Grafana)
- Infrastructure health
- Application performance
- Business metrics (device count, data volume)
- Custom alerts and notifications

## Security Infrastructure

### Network Security
- **Firewall Rules**: Restrict public access
- **VPN**: Secure access to internal services
- **TLS/SSL**: All external communications encrypted

### Secrets Management
- **Kubernetes Secrets**: Encrypted at rest
- **Sealed Secrets**: GitOps-friendly secret management
- **External Secrets Operator**: Integration with HashiCorp Vault

### Access Control
- **RBAC**: Kubernetes role-based access
- **Service Accounts**: Least privilege principle
- **Network Policies**: Restrict pod-to-pod communication

## Cost Optimization

### Resource Requests and Limits
```yaml
resources:
  requests:
    cpu: "100m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

### Autoscaling Policies
- **HPA**: Scale based on CPU/memory metrics
- **VPA**: Right-size resource requests
- **Cluster Autoscaler**: Add/remove nodes as needed

### Storage Optimization
- Use appropriate storage classes
- Implement data retention policies
- Compress logs and backups

## Deployment Strategies

### Rolling Update (Default)
- Zero-downtime deployments
- Gradual rollout of new versions
- Automatic rollback on failure

### Blue-Green Deployment
- Two identical environments
- Switch traffic instantly
- Easy rollback

### Canary Deployment
- Route small percentage of traffic to new version
- Gradually increase percentage
- Monitor metrics before full rollout

## Future Infrastructure Plans

- **Multi-region deployment** for global availability
- **Edge computing** with K3s for remote sites
- **Service mesh** (Istio/Linkerd) for advanced traffic management
- **GitOps** with ArgoCD for declarative deployments
- **Serverless functions** for event-driven processing

---

**Last Updated**: 2025-11-25
