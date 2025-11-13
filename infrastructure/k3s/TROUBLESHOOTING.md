# WebSCADA K3s Troubleshooting Guide

This guide covers common issues and solutions for the WebSCADA K3s development environment.

## Table of Contents

- [K3s Installation Issues](#k3s-installation-issues)
- [Pod Startup Problems](#pod-startup-problems)
- [Network and LoadBalancer Issues](#network-and-loadbalancer-issues)
- [Storage Problems](#storage-problems)
- [DNS Resolution Issues](#dns-resolution-issues)
- [Monitoring Stack Issues](#monitoring-stack-issues)
- [Resource Constraints](#resource-constraints)
- [WSL2 Specific Issues](#wsl2-specific-issues)

## K3s Installation Issues

### K3s Service Won't Start

**Symptoms:**
```bash
sudo systemctl status k3s
# shows: failed or inactive
```

**Solutions:**

1. **Check system logs:**
   ```bash
   sudo journalctl -u k3s -f
   ```

2. **Port conflict (6443):**
   ```bash
   sudo lsof -i :6443
   # Kill conflicting process or change K3s port
   ```

3. **Insufficient resources:**
   - Ensure at least 2GB RAM and 2 CPU cores available
   - Check: `free -h` and `nproc`

4. **Clean reinstall:**
   ```bash
   make k3s-reset
   make k3s-up
   ```

### K3s Command Not Found

**Solution:**
```bash
# Add to PATH
export PATH="/usr/local/bin:$PATH"

# Or use full path
/usr/local/bin/k3s kubectl get nodes
```

### Kubeconfig Permission Denied

**Solution:**
```bash
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config
```

## Pod Startup Problems

### Pods Stuck in Pending

**Symptoms:**
```bash
kubectl get pods -n webscada-dev
# STATUS: Pending
```

**Check:**
```bash
kubectl describe pod <pod-name> -n webscada-dev
```

**Common Causes:**

1. **Insufficient Resources:**
   ```bash
   # Check node resources
   kubectl top nodes
   kubectl describe nodes

   # Solution: Adjust resource limits in deployment or free up resources
   ```

2. **PersistentVolumeClaim not bound:**
   ```bash
   kubectl get pvc -n webscada-dev

   # Solution: Check storage class and provisioner
   kubectl get storageclass
   kubectl logs -n local-path-storage -l app=local-path-provisioner
   ```

3. **Image Pull Error:**
   ```bash
   # Check image name and registry
   kubectl describe pod <pod-name> -n webscada-dev | grep -A 5 "Events:"

   # Solution: Verify image exists and is accessible
   docker pull <image-name>
   ```

### CrashLoopBackOff

**Symptoms:**
```bash
kubectl get pods -n webscada-dev
# STATUS: CrashLoopBackOff
```

**Investigation:**
```bash
# Check logs
kubectl logs <pod-name> -n webscada-dev --previous

# Check events
kubectl describe pod <pod-name> -n webscada-dev

# Common issues:
# 1. Database connection failure
# 2. Missing environment variables
# 3. Port already in use
# 4. Application crashes on startup
```

**Solutions:**

1. **Database not ready:**
   ```bash
   # Wait for database
   kubectl wait --for=condition=ready pod -l app=postgres -n webscada-dev --timeout=300s
   ```

2. **Check environment variables:**
   ```bash
   kubectl get deployment backend -n webscada-dev -o yaml | grep -A 20 "env:"
   ```

3. **Restart deployment:**
   ```bash
   kubectl rollout restart deployment/backend -n webscada-dev
   ```

### ImagePullBackOff

**Solution:**
```bash
# 1. Check if images are built
docker images | grep webscada

# 2. Build images if missing
cd ../../..
./scripts/build-images.sh

# 3. For local images, ensure proper image pull policy
kubectl patch deployment backend -n webscada-dev \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","imagePullPolicy":"IfNotPresent"}]}}}}'
```

## Network and LoadBalancer Issues

### LoadBalancer Service Stuck in Pending

**Symptoms:**
```bash
kubectl get svc -n webscada-dev
# EXTERNAL-IP: <pending>
```

**Solutions:**

1. **Check MetalLB:**
   ```bash
   kubectl get pods -n metallb-system
   kubectl logs -n metallb-system -l app=metallb
   ```

2. **Verify IP Pool:**
   ```bash
   kubectl get ipaddresspool -n metallb-system -o yaml

   # Recreate if needed
   sudo ./setup-metallb.sh
   ```

3. **IP Range Conflict:**
   - Ensure IP range doesn't conflict with DHCP
   - Check router settings
   - Try different IP range

### Cannot Access Services via LoadBalancer IP

**Solutions:**

1. **Firewall blocking:**
   ```bash
   # Check firewall rules
   sudo iptables -L
   sudo ufw status

   # Allow ports
   sudo ufw allow 3000/tcp
   sudo ufw allow 3001/tcp
   ```

2. **Test connectivity:**
   ```bash
   LB_IP=$(kubectl get svc frontend -n webscada-dev -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
   curl -v http://$LB_IP:3000
   ```

3. **Use port-forward as fallback:**
   ```bash
   make port-forward
   ```

### Pod-to-Pod Communication Failure

**Solutions:**

1. **Check NetworkPolicy:**
   ```bash
   kubectl get networkpolicies -n webscada-dev
   kubectl describe networkpolicy webscada-dev-netpol -n webscada-dev
   ```

2. **Test DNS:**
   ```bash
   kubectl run test-pod --rm -it --image=busybox --restart=Never -- nslookup backend.webscada-dev.svc.cluster.local
   ```

3. **Check service endpoints:**
   ```bash
   kubectl get endpoints -n webscada-dev
   ```

## Storage Problems

### PersistentVolumeClaim Stuck in Pending

**Symptoms:**
```bash
kubectl get pvc -n webscada-dev
# STATUS: Pending
```

**Solutions:**

1. **Check StorageClass:**
   ```bash
   kubectl get storageclass
   kubectl describe storageclass local-path
   ```

2. **Check Provisioner:**
   ```bash
   kubectl logs -n local-path-storage -l app=local-path-provisioner -f
   ```

3. **Manual provision:**
   ```bash
   sudo mkdir -p /var/lib/webscada/volumes
   sudo chmod 777 /var/lib/webscada/volumes
   ```

4. **Recreate storage setup:**
   ```bash
   sudo ./setup-storage.sh
   ```

### Disk Space Issues

**Check Usage:**
```bash
df -h /var/lib/webscada
du -sh /var/lib/webscada/*
```

**Clean Up:**
```bash
# Remove old PV data
sudo rm -rf /var/lib/webscada/volumes/pvc-*

# Clean Docker
docker system prune -a --volumes
```

## DNS Resolution Issues

### webscada.local Does Not Resolve

**Solutions:**

1. **Check /etc/hosts:**
   ```bash
   cat /etc/hosts | grep webscada
   ```

2. **Recreate DNS configuration:**
   ```bash
   sudo ./setup-dns.sh
   ```

3. **Test resolution:**
   ```bash
   nslookup webscada.local
   ping webscada.local
   ```

4. **Use IP directly:**
   ```bash
   kubectl get svc -n webscada-dev frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
   ```

### dnsmasq Not Working

**Solutions:**

1. **Install dnsmasq:**
   ```bash
   sudo apt-get update
   sudo apt-get install dnsmasq
   ```

2. **Check dnsmasq status:**
   ```bash
   sudo systemctl status dnsmasq
   sudo systemctl restart dnsmasq
   ```

3. **Check configuration:**
   ```bash
   cat /etc/dnsmasq.d/webscada.conf
   ```

## Monitoring Stack Issues

### Prometheus Not Scraping Metrics

**Solutions:**

1. **Check ServiceMonitors:**
   ```bash
   kubectl get servicemonitors -n webscada-dev
   kubectl describe servicemonitor webscada-backend -n webscada-dev
   ```

2. **Check Prometheus targets:**
   ```bash
   # Port forward Prometheus
   kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
   # Visit: http://localhost:9090/targets
   ```

3. **Check if metrics endpoint exists:**
   ```bash
   kubectl port-forward -n webscada-dev svc/backend 3001:3001
   curl http://localhost:3001/metrics
   ```

### Grafana Cannot Connect to Prometheus

**Solutions:**

1. **Check datasource configuration:**
   ```bash
   kubectl get secret -n monitoring grafana -o yaml
   ```

2. **Test Prometheus URL:**
   ```bash
   kubectl run test --rm -it --image=curlimages/curl --restart=Never -- curl http://prometheus-kube-prometheus-prometheus.monitoring:9090/-/healthy
   ```

3. **Reinstall Grafana:**
   ```bash
   helm uninstall grafana -n monitoring
   ./operators/install-grafana.sh
   ```

### Dashboards Not Loading

**Solutions:**

1. **Check ConfigMaps:**
   ```bash
   kubectl get configmaps -n monitoring | grep grafana-dashboard
   ```

2. **Reinstall dashboards:**
   ```bash
   ./dashboards/install-dashboards.sh
   ```

3. **Check Grafana logs:**
   ```bash
   kubectl logs -n monitoring -l app.kubernetes.io/name=grafana -f
   ```

## Resource Constraints

### Out of Memory

**Symptoms:**
```bash
kubectl get pods -n webscada-dev
# OOMKilled status
```

**Solutions:**

1. **Check resource usage:**
   ```bash
   kubectl top pods -n webscada-dev
   kubectl describe node
   ```

2. **Increase memory limits:**
   ```bash
   # Edit deployment
   kubectl edit deployment backend -n webscada-dev
   # Increase resources.limits.memory
   ```

3. **Adjust ResourceQuota:**
   ```bash
   kubectl edit resourcequota webscada-dev-quota -n webscada-dev
   ```

### CPU Throttling

**Check:**
```bash
kubectl top pods -n webscada-dev
```

**Solution:**
```bash
# Increase CPU limits
kubectl edit deployment <name> -n webscada-dev
```

## WSL2 Specific Issues

### K3s Service Fails on WSL2

**Solutions:**

1. **Enable systemd in WSL2:**
   ```bash
   # Edit /etc/wsl.conf
   sudo nano /etc/wsl.conf

   # Add:
   [boot]
   systemd=true

   # Restart WSL from PowerShell:
   wsl --shutdown
   wsl
   ```

2. **Check WSL memory:**
   ```bash
   # Create .wslconfig in Windows user directory
   # C:\Users\<YourUsername>\.wslconfig

   [wsl2]
   memory=8GB
   processors=4
   ```

### Network Issues in WSL2

**Solutions:**

1. **Reset network:**
   ```bash
   # From PowerShell (as Administrator)
   wsl --shutdown
   netsh winsock reset
   netsh int ip reset all
   netsh winhttp reset proxy
   ipconfig /flushdns
   ```

2. **Use bridged networking:**
   - Configure in .wslconfig:
     ```
     [wsl2]
     networkingMode=bridged
     vmSwitch=<your-external-switch>
     ```

### Cannot Access Services from Windows

**Solutions:**

1. **Use WSL2 IP:**
   ```bash
   # Get WSL2 IP
   ip addr show eth0 | grep inet

   # Access from Windows using this IP
   ```

2. **Port forwarding:**
   ```bash
   # From PowerShell (as Administrator)
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<wsl2-ip>
   ```

3. **Add to Windows hosts file:**
   ```
   C:\Windows\System32\drivers\etc\hosts

   <loadbalancer-ip>  webscada.local
   ```

## General Debugging Commands

```bash
# View all resources
kubectl get all -n webscada-dev

# Describe specific resource
kubectl describe <resource-type> <name> -n webscada-dev

# Check logs
kubectl logs <pod-name> -n webscada-dev -f

# Events
kubectl get events -n webscada-dev --sort-by=.lastTimestamp

# Resource usage
kubectl top nodes
kubectl top pods -n webscada-dev

# Network debugging
kubectl run debug --rm -it --image=nicolaka/netshoot --restart=Never -- /bin/bash

# Run health check
./health-check.sh
```

## Getting Help

If you're still experiencing issues:

1. **Run health check:**
   ```bash
   make verify
   ```

2. **Gather logs:**
   ```bash
   make logs > webscada-logs.txt
   kubectl get events -A > events.txt
   kubectl get all -A > resources.txt
   ```

3. **Check GitHub issues:**
   - Search existing issues
   - Create new issue with logs and configuration

4. **Community support:**
   - K3s documentation: https://docs.k3s.io
   - Kubernetes troubleshooting: https://kubernetes.io/docs/tasks/debug/

## Useful Links

- [K3s Documentation](https://docs.k3s.io/)
- [MetalLB Documentation](https://metallb.universe.tf/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Cert-Manager Documentation](https://cert-manager.io/docs/)
- [Sealed Secrets](https://sealed-secrets.netlify.app/)
