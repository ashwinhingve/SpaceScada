# WebSCADA Deployment Guide

Complete guide for deploying the WebSCADA MVP system to Kubernetes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Deployment](#local-development-deployment)
3. [Production Deployment](#production-deployment)
4. [Monitoring Setup](#monitoring-setup)
5. [Troubleshooting](#troubleshooting)
6. [Maintenance](#maintenance)

---

## Prerequisites

### Required Tools

```bash
# Kubernetes CLI
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Skaffold (optional)
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
sudo install skaffold /usr/local/bin/
```

### Kubernetes Cluster

You need a Kubernetes cluster. Options:

**Local Development:**
- **Minikube**: `minikube start --cpus=4 --memory=8192`
- **Kind**: `kind create cluster --config infrastructure/kind-config.yaml`
- **Docker Desktop**: Enable Kubernetes in settings

**Cloud:**
- **GKE**: `gcloud container clusters create webscada-cluster`
- **EKS**: `eksctl create cluster --name webscada-cluster`
- **AKS**: `az aks create --name webscada-cluster --resource-group webscada`

### Verify Cluster Access

```bash
kubectl cluster-info
kubectl get nodes
```

---

## Local Development Deployment

### Method 1: Using Skaffold (Recommended for Development)

Skaffold provides hot-reload and automatic rebuilding:

```bash
# Start development environment
skaffold dev

# Or with specific profile
skaffold dev --profile=dev

# Deploy without watching (no hot-reload)
skaffold run
```

**What Skaffold does:**
1. Builds Docker images locally
2. Deploys to Kubernetes
3. Watches for file changes
4. Auto-rebuilds and redeploys
5. Streams logs
6. Port-forwards services

**Access the application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Method 2: Using deploy.sh Script

The deployment script provides full control:

```bash
# Make script executable
chmod +x deploy.sh

# Step 1: Install Helm dependencies (PostgreSQL, Redis)
./deploy.sh helm-deps -n webscada

# Step 2: Deploy application
./deploy.sh install -n webscada

# Check deployment status
./deploy.sh status -n webscada
```

**Script Commands:**
- `install` - Fresh installation
- `upgrade` - Update existing deployment
- `rollback` - Rollback to previous version
- `status` - Check deployment status
- `cleanup` - Remove all resources
- `helm-deps` - Install PostgreSQL and Redis via Helm

**Options:**
- `-n, --namespace` - Kubernetes namespace (default: webscada)
- `-e, --env` - Environment (dev/staging/prod)
- `--dry-run` - Show what would be deployed
- `--skip-tests` - Skip pre-deployment tests

### Method 3: Manual kubectl Deployment

Step-by-step manual deployment:

```bash
# 1. Create namespace
kubectl apply -f infrastructure/k8s/namespace.yaml

# 2. Add Helm repos
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 3. Install PostgreSQL
helm install postgresql bitnami/postgresql \
  -f infrastructure/helm/values/postgresql-values.yaml \
  -n webscada

# 4. Install Redis
helm install redis bitnami/redis \
  -f infrastructure/helm/values/redis-values.yaml \
  -n webscada

# 5. Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n webscada --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n webscada --timeout=300s

# 6. Deploy ConfigMaps and Secrets
kubectl apply -f infrastructure/k8s/base/ -n webscada

# 7. Deploy application components
kubectl apply -f infrastructure/k8s/backend-deployment.yaml -n webscada
kubectl apply -f infrastructure/k8s/frontend-deployment.yaml -n webscada
kubectl apply -f infrastructure/k8s/ingress.yaml -n webscada

# 8. Wait for deployments
kubectl wait --for=condition=available deployment/backend -n webscada --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n webscada --timeout=300s

# 9. Check status
kubectl get all -n webscada
```

### Access the Application Locally

```bash
# Port forward frontend
kubectl port-forward svc/frontend 3000:3000 -n webscada

# Port forward backend
kubectl port-forward svc/backend 3001:3001 -n webscada

# Access in browser
open http://localhost:3000
```

---

## Production Deployment

### 1. Prepare Production Environment

#### Install Required Operators

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager for TLS certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install Prometheus Operator (for monitoring)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Install Sealed Secrets (for secret management)
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

### 2. Configure Secrets with SealedSecrets

```bash
# Install kubeseal CLI
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64
sudo install -m 755 kubeseal-linux-amd64 /usr/local/bin/kubeseal

# Create sealed secret from existing secret
kubeseal -f infrastructure/k8s/base/backend-secrets.yaml \
  -w infrastructure/k8s/base/backend-sealed-secrets.yaml

# Apply sealed secret
kubectl apply -f infrastructure/k8s/base/backend-sealed-secrets.yaml -n webscada
```

### 3. Update Configuration for Production

Edit `infrastructure/k8s/base/backend-config.yaml`:

```yaml
data:
  NODE_ENV: production
  LOG_LEVEL: warn  # Reduce logging in production
  CORS_ORIGIN: https://webscada.yourdomain.com
```

Edit `infrastructure/k8s/ingress.yaml`:

```yaml
spec:
  tls:
    - hosts:
        - webscada.yourdomain.com
      secretName: webscada-tls
  rules:
    - host: webscada.yourdomain.com
```

### 4. Deploy to Production

```bash
# Using deploy script
./deploy.sh install -n webscada -e prod

# Or using Skaffold production profile
skaffold run --profile=prod
```

### 5. Configure DNS

Point your domain to the Ingress LoadBalancer:

```bash
# Get LoadBalancer IP
kubectl get svc ingress-nginx-controller -n ingress-nginx

# Create DNS A record
# webscada.yourdomain.com → <EXTERNAL-IP>
```

### 6. Verify TLS Certificate

```bash
# Check cert-manager certificate
kubectl get certificate -n webscada
kubectl describe certificate webscada-tls -n webscada

# Wait for certificate to be ready
kubectl wait --for=condition=ready certificate/webscada-tls -n webscada
```

---

## Monitoring Setup

### Install Monitoring Stack

If not already installed:

```bash
# Install Prometheus + Grafana stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace

# Deploy ServiceMonitors
kubectl apply -f infrastructure/k8s/monitoring/servicemonitor.yaml -n webscada
```

### Access Grafana

```bash
# Get Grafana admin password
kubectl get secret prometheus-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring

# Login at http://localhost:3000
# Username: admin
# Password: <from above command>
```

### Import Dashboard

1. Open Grafana: http://localhost:3000
2. Go to Dashboards → Import
3. Upload `infrastructure/k8s/monitoring/grafana-dashboard.json`
4. Select Prometheus datasource
5. Click Import

### Configure Alerts

Alerts are configured in `infrastructure/k8s/monitoring/servicemonitor.yaml`:

- Backend pod down
- High CPU/memory usage
- Database connectivity issues
- Frequent pod restarts

Configure alert receivers in Prometheus:

```bash
kubectl edit configmap prometheus-prometheus-kube-prometheus-prometheus -n monitoring
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n webscada

# Describe pod to see events
kubectl describe pod <pod-name> -n webscada

# Check logs
kubectl logs <pod-name> -n webscada

# Common causes:
# - Image pull errors: Check image name and registry access
# - Resource limits: Increase CPU/memory limits
# - ConfigMap/Secret missing: Verify they exist
```

#### 2. Database Connection Failures

```bash
# Check PostgreSQL pod
kubectl get pods -l app.kubernetes.io/name=postgresql -n webscada

# Check PostgreSQL logs
kubectl logs -l app.kubernetes.io/name=postgresql -n webscada

# Test connection from backend pod
kubectl exec -it deployment/backend -n webscada -- sh
> nc -zv postgres 5432
```

#### 3. Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n webscada
kubectl describe ingress webscada-ingress -n webscada

# Check ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Verify DNS resolution
nslookup webscada.yourdomain.com
```

#### 4. WebSocket Connections Failing

```bash
# Check backend logs
kubectl logs -f deployment/backend -n webscada | grep -i websocket

# Verify ingress WebSocket annotations
kubectl get ingress webscada-ingress -n webscada -o yaml | grep -A5 annotations

# Test WebSocket connection
wscat -c ws://backend.webscada.svc.cluster.local:3001/socket.io
```

### Debug Commands

```bash
# Get all resources in namespace
kubectl get all -n webscada

# Check events
kubectl get events -n webscada --sort-by='.lastTimestamp'

# Execute shell in pod
kubectl exec -it deployment/backend -n webscada -- sh

# Copy files from pod
kubectl cp webscada/<pod-name>:/app/logs ./logs

# View resource usage
kubectl top pods -n webscada
kubectl top nodes

# Check HPA status
kubectl get hpa -n webscada
kubectl describe hpa backend-hpa -n webscada
```

---

## Maintenance

### Updating the Application

```bash
# Using deploy script (saves rollback state)
./deploy.sh upgrade -n webscada

# Using Skaffold
skaffold run

# Using kubectl (manual)
kubectl apply -f infrastructure/k8s/backend-deployment.yaml -n webscada
kubectl rollout status deployment/backend -n webscada
```

### Rollback

```bash
# Using deploy script
./deploy.sh rollback -n webscada

# Using kubectl
kubectl rollout undo deployment/backend -n webscada
kubectl rollout undo deployment/frontend -n webscada

# Rollback to specific revision
kubectl rollout history deployment/backend -n webscada
kubectl rollout undo deployment/backend --to-revision=2 -n webscada
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment/backend --replicas=4 -n webscada

# Update HPA
kubectl edit hpa backend-hpa -n webscada
```

### Database Backup

```bash
# PostgreSQL backup
kubectl exec -n webscada postgresql-0 -- \
  pg_dump -U webscada webscada > backup.sql

# Restore
cat backup.sql | kubectl exec -i -n webscada postgresql-0 -- \
  psql -U webscada -d webscada
```

### Log Collection

```bash
# Save logs for all pods
kubectl logs -l app=backend -n webscada > backend-logs.txt
kubectl logs -l app=frontend -n webscada > frontend-logs.txt

# Stream logs with timestamps
kubectl logs -f --timestamps deployment/backend -n webscada
```

### Clean Up

```bash
# Using deploy script
./deploy.sh cleanup -n webscada

# Manual cleanup
kubectl delete namespace webscada

# Uninstall Helm releases
helm uninstall postgresql -n webscada
helm uninstall redis -n webscada
```

---

## Performance Optimization

### Resource Tuning

Monitor actual resource usage:

```bash
kubectl top pods -n webscada
```

Adjust resources in deployment files based on actual usage.

### Database Optimization

PostgreSQL tuning is configured in `infrastructure/helm/values/postgresql-values.yaml`:

- Connection pooling
- Shared buffers
- Effective cache size
- Work memory

### Caching Strategy

Redis configuration in `infrastructure/helm/values/redis-values.yaml`:

- LRU eviction policy
- AOF persistence
- Memory limits

---

## Security Checklist

- [ ] Use SealedSecrets for all sensitive data
- [ ] Enable RBAC with least privilege
- [ ] Configure Network Policies
- [ ] Enable Pod Security Standards
- [ ] Use non-root containers
- [ ] Scan images for vulnerabilities
- [ ] Enable audit logging
- [ ] Configure TLS/SSL for all ingress
- [ ] Regular security updates
- [ ] Implement secrets rotation

---

## Support

For issues and questions:

1. Check logs: `kubectl logs -f deployment/backend -n webscada`
2. Check events: `kubectl get events -n webscada`
3. Review documentation in `infrastructure/k8s/README.md`
4. Use deployment script: `./deploy.sh status -n webscada`

---

## Additional Resources

- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Helm Charts**: https://helm.sh/docs/
- **Skaffold**: https://skaffold.dev/
- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/
