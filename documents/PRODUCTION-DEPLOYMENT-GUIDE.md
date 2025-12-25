# Production Deployment Guide - Multi-Site VPS

This guide covers deploying WebSCADA on an Ubuntu VPS that already hosts multiple websites using NGINX on ports 80 and 443.

## Overview

The deployment is designed to be **completely isolated** and **conflict-free**:
- ✅ Uses standard ports 80/443 (no conflicts)
- ✅ Server blocks isolate traffic by domain name
- ✅ Docker containers bind to localhost only
- ✅ Existing websites remain completely unaffected
- ✅ Safe rollback procedures included

---

## Pre-Deployment Checklist

### 1. DNS Configuration
- [ ] Domain `webscada.spaceautotech.com` points to your VPS IP
- [ ] DNS propagation complete (check with `dig webscada.spaceautotech.com`)

### 2. VPS Requirements
- [ ] Ubuntu 20.04 or later
- [ ] At least 4GB RAM
- [ ] At least 20GB free disk space
- [ ] Root or sudo access
- [ ] NGINX already installed and running
- [ ] Ports 80 and 443 in use by existing NGINX

### 3. Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Update `DOMAIN=webscada.spaceautotech.com`
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Set strong `REDIS_PASSWORD`
- [ ] Generate and set `JWT_SECRET` (use: `openssl rand -base64 32`)
- [ ] Update `CORS_ORIGIN=https://webscada.spaceautotech.com`

### 4. SSL Certificates
- [ ] Certbot installed: `sudo apt install certbot python3-certbot-nginx`
- [ ] SSL certificate obtained: `sudo certbot --nginx -d webscada.spaceautotech.com`
- [ ] Certificate files exist in `/etc/letsencrypt/live/webscada.spaceautotech.com/`

---

## Deployment Steps

### Step 1: Upload Files to VPS

```bash
# On your local machine
scp -r webscada/ user@your-vps-ip:/opt/webscada/
```

Or use Git:
```bash
# On VPS
cd /opt
git clone <your-repo-url> webscada
cd webscada
```

### Step 2: Configure Environment

```bash
cd /opt/webscada
cp .env.production.example .env.production
nano .env.production
```

Update all required values (see checklist above).

### Step 3: Run Initial Setup

```bash
sudo ./deploy-vps.sh setup
```

This will:
- ✅ Install Docker and Docker Compose
- ✅ Create required directories
- ✅ Setup log rotation
- ✅ Check for SSL certificates
- ✅ Install NGINX configuration (but NOT activate it yet)
- ✅ Test NGINX configuration for syntax errors

**IMPORTANT**: The setup command will NOT reload NGINX automatically. Your existing sites remain unaffected.

### Step 4: Verify NGINX Configuration

```bash
# Test NGINX configuration
sudo nginx -t

# Check that your existing sites still work
curl -I https://your-existing-site.com
```

### Step 5: Activate NGINX Configuration

Only after verifying everything is OK:

```bash
# Reload NGINX to activate WebSCADA
sudo systemctl reload nginx
```

**Rollback if needed:**
```bash
sudo rm /etc/nginx/sites-enabled/webscada.conf
sudo systemctl reload nginx
```

### Step 6: Deploy Application

```bash
sudo ./deploy-vps.sh deploy
```

This will:
- ✅ Run pre-deployment checks (SSL, NGINX, etc.)
- ✅ Pull and build Docker images
- ✅ Start all containers
- ✅ Verify containers are running
- ✅ Check port bindings (localhost only)
- ✅ Test health endpoints

### Step 7: Verify Deployment

```bash
# Check all containers are running
docker ps

# Test WebSCADA health
curl -I https://webscada.spaceautotech.com/health

# Check existing sites still work
curl -I https://your-existing-site.com
```

---

## How It Works (No Conflicts)

### Server Name Isolation

NGINX uses the `server_name` directive to route traffic:

```nginx
# WebSCADA server block
server {
    listen 443 ssl http2;
    server_name webscada.spaceautotech.com;  # Only handles this domain
    # ... WebSCADA configuration
}

# Your existing site (example)
server {
    listen 443 ssl http2;
    server_name existing-site.com;  # Only handles this domain
    # ... Existing site configuration
}
```

**Result**: Both sites share ports 80/443, but traffic is routed based on domain name. No conflicts!

### Localhost-Only Binding

Docker containers bind to localhost only:

```yaml
ports:
  - "127.0.0.1:3000:3000"  # Frontend
  - "127.0.0.1:3001:3001"  # Backend
  - "127.0.0.1:3002:3002"  # Realtime
```

**Result**: Containers are only accessible via NGINX reverse proxy, not directly from the internet.

---

## Management Commands

```bash
# Start services
sudo ./deploy-vps.sh start

# Stop services
sudo ./deploy-vps.sh stop

# Restart services
sudo ./deploy-vps.sh restart

# View logs
./deploy-vps.sh logs

# Check status
./deploy-vps.sh status

# Backup data
sudo ./deploy-vps.sh backup

# Restore from backup
sudo ./deploy-vps.sh restore
```

---

## Troubleshooting

### Issue: SSL Certificate Not Found

**Symptom**: Deployment fails with "SSL certificates not found"

**Solution**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d webscada.spaceautotech.com
```

### Issue: NGINX Configuration Test Fails

**Symptom**: `nginx -t` shows errors

**Solution**:
```bash
# Check the error message
sudo nginx -t

# Common issues:
# 1. Duplicate server_name - check other configs
# 2. SSL certificate paths wrong - verify with certbot
# 3. Syntax error - review /etc/nginx/sites-available/webscada.conf
```

### Issue: Containers Not Starting

**Symptom**: Docker containers exit immediately

**Solution**:
```bash
# Check container logs
docker logs webscada-frontend
docker logs webscada-backend

# Common issues:
# 1. Database connection failed - check POSTGRES_PASSWORD in .env.production
# 2. Redis connection failed - check REDIS_PASSWORD
# 3. Port already in use - check with: netstat -tlnp | grep -E ':(3000|3001|3002)'
```

### Issue: Existing Sites Stop Working

**Symptom**: Other websites return errors after deployment

**Solution**:
```bash
# Immediately disable WebSCADA
sudo rm /etc/nginx/sites-enabled/webscada.conf
sudo systemctl reload nginx

# Check NGINX error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Re-enable after fixing issues
sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Issue: WebSCADA Returns 502 Bad Gateway

**Symptom**: NGINX returns 502 error

**Solution**:
```bash
# Check if containers are running
docker ps | grep webscada

# Check if services are healthy
curl http://127.0.0.1:3000/  # Frontend
curl http://127.0.0.1:3001/health  # Backend

# Check NGINX error logs
sudo tail -f /var/log/nginx/webscada_error.log

# Restart containers if needed
sudo ./deploy-vps.sh restart
```

---

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   sudo ./deploy-vps.sh deploy
   ```

3. **Backup Schedule**
   ```bash
   # Add to crontab
   0 2 * * * /opt/webscada/deploy-vps.sh backup
   ```

4. **Monitor Logs**
   ```bash
   # Application logs
   tail -f /var/log/webscada/*.log
   
   # NGINX logs
   tail -f /var/log/nginx/webscada_*.log
   
   # Docker logs
   docker logs -f webscada-backend
   ```

---

## Rollback Procedure

If you need to completely remove WebSCADA:

```bash
# 1. Stop and remove containers
sudo ./deploy-vps.sh stop

# 2. Disable NGINX site
sudo rm /etc/nginx/sites-enabled/webscada.conf
sudo systemctl reload nginx

# 3. Verify existing sites work
curl -I https://your-existing-site.com

# 4. (Optional) Remove all data
sudo ./deploy-vps.sh clean
```

---

## Support

For issues or questions:
1. Check logs: `./deploy-vps.sh logs`
2. Review NGINX logs: `tail -f /var/log/nginx/webscada_error.log`
3. Check container status: `docker ps -a`
4. Test NGINX config: `sudo nginx -t`
