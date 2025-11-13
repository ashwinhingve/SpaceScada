# WebSCADA K3s Development Environment

A complete local Kubernetes development environment optimized for WebSCADA using K3s.

## Features

- **Lightweight K3s** - Production-grade Kubernetes that runs everywhere
- **MetalLB LoadBalancer** - Local load balancer for service exposure
- **Local Storage** - Persistent volume provisioning (50GB)
- **Prometheus + Grafana** - Complete monitoring stack with SCADA dashboards
- **Cert-Manager** - Automatic TLS certificate management
- **Sealed Secrets** - Secure secret management
- **Local DNS** - *.webscada.local domain resolution
- **Resource Quotas** - 4 CPU, 8GB RAM limits for development

## Quick Start

### Prerequisites

- Linux system or WSL2
- 4 CPU cores, 8GB RAM
- 50GB available disk space
- sudo access

### Installation

```bash
# Change to K3s directory
cd infrastructure/k3s

# Complete setup (installs everything)
make k3s-up

# Install operators
make operators

# Deploy WebSCADA
make deploy-scada

# Verify everything is running
make verify
```

That's it! Your K3s cluster is ready.

## Directory Structure

```
infrastructure/k3s/
├── Makefile                     # Main commands
├── install-k3s.sh              # K3s installation
├── setup-metallb.sh            # LoadBalancer setup
├── setup-storage.sh            # Storage configuration
├── setup-dns.sh                # DNS configuration
├── health-check.sh             # Health verification
├── kubeconfig-setup.sh         # kubectl configuration
├── aliases.sh                  # Helpful aliases
├── namespaces/
│   └── webscada-dev.yaml       # Namespace with quotas
├── operators/
│   ├── install-prometheus.sh   # Prometheus Operator
│   ├── install-grafana.sh      # Grafana with dashboards
│   ├── install-cert-manager.sh # Certificate management
│   └── install-sealed-secrets.sh # Secrets management
├── dashboards/
│   ├── device-status.json      # Device monitoring
│   ├── system-performance.json # System metrics
│   └── install-dashboards.sh   # Dashboard installer
├── README.md                    # This file
└── TROUBLESHOOTING.md          # Problem solutions
```

## Makefile Commands

### Cluster Management

```bash
make k3s-up          # Install and start K3s cluster
make k3s-down        # Stop K3s cluster (keeps data)
make k3s-up-only     # Start existing K3s cluster
make k3s-reset       # Complete cleanup and removal
```

### Operators

```bash
make operators       # Install all operators
```

### Deployment

```bash
make deploy-scada    # Deploy WebSCADA applications
make status          # Show status of all components
make clean           # Remove WebSCADA deployments
```

### Monitoring

```bash
make monitor         # Open Grafana
make logs            # Tail all WebSCADA logs
make logs-backend    # Tail backend logs
make logs-frontend   # Tail frontend logs
```

### Utilities

```bash
make verify          # Run health check
make port-forward    # Forward all services to localhost
make shell-backend   # Open shell in backend pod
make top             # Show resource usage
make info            # Show cluster information
make help            # Show all commands
```

## Accessing Services

### Via LoadBalancer IPs

```bash
# Get service IPs
kubectl get svc -n webscada-dev

# Access services
Frontend:    http://<frontend-ip>:3000
Backend:     http://<backend-ip>:3001
Grafana:     http://<grafana-ip>
```

### Via Local DNS

```bash
# After running setup-dns.sh
Frontend:    http://webscada.local:3000
Backend:     http://api.webscada.local:3001
Grafana:     http://grafana.webscada.local
```

### Via Port Forwarding

```bash
make port-forward

# Then access:
Frontend:    http://localhost:3000
Backend:     http://localhost:3001
Grafana:     http://localhost:3002
```

## Configuration

### Resource Limits

Default configuration (can be adjusted):
- **CPU**: 4 cores total
- **Memory**: 8GB total
- **Storage**: 50GB total

Edit quotas in: `namespaces/webscada-dev.yaml`

### Storage Location

Default: `/var/lib/webscada`

Change in: `setup-storage.sh`

### IP Address Pool

MetalLB default: 192.168.1.240-192.168.1.250

Change during setup or edit: `infrastructure/k8s/metallb-config.yaml`

## Monitoring

### Prometheus

```bash
# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Visit: http://localhost:9090
```

### Grafana

```bash
# Get Grafana password
kubectl get secret -n monitoring grafana -o jsonpath='{.data.admin-password}' | base64 -d

# Access Grafana
make monitor
# Or: http://grafana.webscada.local
# Username: admin
```

### Pre-installed Dashboards

- **Device Status** - Device monitoring and availability
- **System Performance** - CPU, memory, network metrics
- **WebSCADA Overview** - Complete system status

## Security

### TLS Certificates

Cert-manager creates self-signed certificates for development.

```bash
# Export CA certificate
kubectl get secret -n cert-manager webscada-ca-secret \
  -o jsonpath='{.data.tls\.crt}' | base64 -d > webscada-ca.crt

# Install in your browser for trusted HTTPS
```

### Sealed Secrets

Encrypt secrets before committing to Git:

```bash
# Create sealed secret
create-sealed-secret my-secret webscada-dev username=admin password=secret

# Apply sealed secret
kubectl apply -f my-secret-sealed.yaml
```

## Helpful Aliases

Source the aliases file for shortcuts:

```bash
source aliases.sh

# Now use:
ws              # kubectl -n webscada-dev
wsp             # Get pods in webscada-dev
wsl             # Tail logs
backend-shell   # Shell into backend pod
pf-frontend     # Port forward frontend

# And many more! Type: khelp
```

## Troubleshooting

### Common Issues

1. **K3s won't start:**
   ```bash
   sudo journalctl -u k3s -f
   ```

2. **Pods stuck in Pending:**
   ```bash
   kubectl describe pod <pod-name> -n webscada-dev
   ```

3. **LoadBalancer no IP:**
   ```bash
   kubectl get pods -n metallb-system
   sudo ./setup-metallb.sh
   ```

4. **Storage issues:**
   ```bash
   sudo chmod 777 /var/lib/webscada/volumes
   ```

5. **DNS not working:**
   ```bash
   sudo ./setup-dns.sh
   ```

For detailed troubleshooting, see: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Health Check

```bash
make verify
```

This runs a comprehensive health check of all components.

## Advanced Usage

### Custom Namespace

```bash
# Deploy to custom namespace
kubectl create namespace my-namespace
kubectl apply -f ../k8s/ -n my-namespace
```

### Scale Deployments

```bash
kubectl scale deployment backend -n webscada-dev --replicas=3
```

### Update Images

```bash
# Build new images
cd ../../..
./scripts/build-images.sh VERSION=v1.1.0

# Update deployment
kubectl set image deployment/backend backend=webscada/backend:v1.1.0 -n webscada-dev
```

### Backup and Restore

```bash
# Backup
kubectl get all -n webscada-dev -o yaml > webscada-backup.yaml

# Restore
kubectl apply -f webscada-backup.yaml
```

## Development Workflow

### Typical Development Session

```bash
# 1. Start cluster
make k3s-up-only

# 2. Deploy latest code
make deploy-scada

# 3. Watch logs
make logs

# 4. Make code changes
# ... edit code ...

# 5. Rebuild and redeploy
cd ../../..
./scripts/build-images.sh
kubectl rollout restart deployment/backend -n webscada-dev

# 6. Monitor
make monitor
```

### Using Skaffold

For automatic rebuild and deploy on file changes:

```bash
cd ../../..
skaffold dev
```

## Uninstallation

### Remove WebSCADA deployments (keep cluster)

```bash
make clean
```

### Complete removal

```bash
make k3s-reset
```

This removes:
- K3s cluster
- All data
- Storage directories
- Configuration files

## Resources

- **K3s**: 400-500MB RAM, 2 CPU cores
- **MetalLB**: 50-100MB RAM
- **Prometheus**: 500MB-1GB RAM
- **Grafana**: 256-512MB RAM
- **WebSCADA**: Varies by deployment

## Performance Tips

1. **SSD recommended** for /var/lib/webscada
2. **Disable swap** for better performance
3. **Use local registry** for faster image pulls
4. **Resource limits** prevent overcommitment

## Support

- **Documentation**: This README and TROUBLESHOOTING.md
- **Health Check**: `make verify`
- **Logs**: `make logs`
- **Community**: GitHub Issues

## License

Part of the WebSCADA project. See main repository for license information.
