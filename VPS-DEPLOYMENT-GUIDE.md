# WebSCADA VPS Deployment Guide

Complete guide for deploying WebSCADA on a Hostinger Ubuntu VPS with existing Nginx on ports 80/443.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Port Configuration](#port-configuration)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Recovery](#backup--recovery)
10. [Security Best Practices](#security-best-practices)

---

## Prerequisites

### VPS Requirements

- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: 2 cores minimum (4 cores recommended)
- **Storage**: 40GB minimum (SSD recommended)
- **Network**: Public IP address with ports 8080, 8443 available

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Nginx (already installed)
- Git
- Domain name pointing to your VPS

### Access Requirements

- SSH access to VPS with root/sudo privileges
- Domain DNS configured
- (Optional) SSL certificates or ability to generate with Let's Encrypt

---

## Architecture Overview

### Port Mapping

The deployment uses non-standard ports to avoid conflicts with existing Nginx:

| Service          | Internal Port | External Access       |
| ---------------- | ------------- | --------------------- |
| Frontend         | 3000          | Via Nginx (8080/8443) |
| Backend API      | 3001          | Via Nginx (8080/8443) |
| Realtime Service | 3002          | Via Nginx (8080/8443) |
| PostgreSQL       | 5432          | Internal only         |
| Redis            | 6379          | Internal only         |
| Mosquitto MQTT   | 1883          | Internal only         |
| Simulator        | 5020          | Internal only         |

### Network Architecture

```
Internet
    ↓
Nginx (ports 80, 443, 8080, 8443)
    ↓
Docker Internal Network (172.25.0.0/16)
    ↓
┌─────────────────────────────────────────┐
│ Frontend (3000) ← Users access           │
│ Backend API (3001) ← REST & WebSocket    │
│ Realtime Service (3002) ← Data streaming │
│ PostgreSQL (5432) ← Data storage         │
│ Redis (6379) ← Caching & pub/sub        │
│ Mosquitto (1883) ← MQTT messaging        │
│ Simulator (5020) ← Device simulation     │
└─────────────────────────────────────────┘
```

---

## Step-by-Step Deployment

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# Or with sudo user:
ssh your-user@your-vps-ip
```

### Step 2: Clone the Repository

```bash
cd /opt
git clone https://github.com/your-username/webscada.git
cd webscada
```

### Step 3: Run Initial Setup

```bash
# Make deployment script executable
chmod +x deploy-vps.sh

# Run VPS setup (installs Docker, creates directories)
sudo ./deploy-vps.sh setup
```

This command will:

- Update system packages
- Install Docker and Docker Compose
- Create backup and log directories
- Set up log rotation
- Create environment file template

### Step 4: Configure Environment Variables

```bash
# Edit the production environment file
sudo nano .env.production
```

**Required configurations:**

```bash
# Your domain
DOMAIN=webscada.yourdomain.com

# Strong database password
POSTGRES_PASSWORD=your_strong_database_password_here

# Strong Redis password
REDIS_PASSWORD=your_strong_redis_password_here

# JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_here

# CORS origin
CORS_ORIGIN=https://webscada.yourdomain.com

# Public URLs
NEXT_PUBLIC_API_URL=https://webscada.yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://webscada.yourdomain.com
```

**Generate secure passwords:**

```bash
# Generate PostgreSQL password
openssl rand -base64 24

# Generate Redis password
openssl rand -base64 24

# Generate JWT secret
openssl rand -base64 32
```

### Step 5: Configure Nginx

#### Option A: Using Custom Ports (Recommended)

```bash
# Copy Nginx configuration
sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/webscada.conf

# Edit the configuration
sudo nano /etc/nginx/sites-available/webscada.conf
```

**Update these lines:**

```nginx
# Change server_name to your domain
server_name webscada.yourdomain.com;

# Update SSL certificate paths (if using SSL)
ssl_certificate /etc/letsencrypt/live/webscada.yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/webscada.yourdomain.com/privkey.pem;
```

**Enable the site:**

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Option B: Without SSL (HTTP Only - Not Recommended for Production)

Uncomment the HTTP-only server block at the bottom of `webscada.conf` and skip SSL configuration.

### Step 6: Setup SSL Certificate (Recommended)

#### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d webscada.yourdomain.com

# Start Nginx
sudo systemctl start nginx

# Enable auto-renewal
sudo systemctl enable certbot.timer
```

#### Using Existing Certificate

Copy your certificate files to:

- Certificate: `/etc/ssl/certs/webscada.crt`
- Private Key: `/etc/ssl/private/webscada.key`

Update paths in `webscada.conf`.

### Step 7: Configure Docker Compose Ports

The `docker-compose.vps.yml` exposes containers only on internal Docker network. To make them accessible via Nginx:

```bash
# Update backend.Dockerfile to expose port properly
# Update frontend.Dockerfile to expose port properly
# No changes needed - already configured correctly
```

### Step 8: Build and Deploy

```bash
# Deploy the application
sudo ./deploy-vps.sh deploy
```

This will:

1. Pull/build Docker images
2. Start all containers
3. Wait for services to be healthy
4. Show deployment status

### Step 9: Verify Deployment

```bash
# Check container status
sudo ./deploy-vps.sh status

# View logs
sudo ./deploy-vps.sh logs

# Check specific service
docker logs webscada-backend
docker logs webscada-frontend
```

### Step 10: Test Access

1. **Web Interface**: `https://webscada.yourdomain.com:8443`
2. **API Health Check**: `https://webscada.yourdomain.com:8443/api/health`
3. **Backend Health**: `https://webscada.yourdomain.com:8443/health`

---

## Port Configuration

### Firewall Configuration (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow standard Nginx ports (for existing websites)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow WebSCADA custom ports
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp

# Check status
sudo ufw status
```

### Docker Network Configuration

Containers communicate via internal Docker network (`172.25.0.0/16`). No external ports are exposed except through Nginx reverse proxy.

To verify network:

```bash
docker network ls
docker network inspect webscada_webscada-internal
```

---

## Nginx Configuration

### Upstream Configuration

The Nginx config defines upstream servers for load balancing:

```nginx
upstream webscada_frontend {
    server 127.0.0.1:3000 fail_timeout=30s max_fails=3;
    keepalive 32;
}

upstream webscada_backend {
    server 127.0.0.1:3001 fail_timeout=30s max_fails=3;
    keepalive 32;
}
```

Wait, this is incorrect. The containers are on the Docker network, not localhost. Let me fix the Nginx configuration.

### Correct Nginx Configuration

Since containers are in Docker network, Nginx needs to proxy to the Docker network, not localhost. Update the configuration:

```nginx
# Use Docker container names or service names
upstream webscada_frontend {
    server webscada-frontend:3000 fail_timeout=30s max_fails=3;
    keepalive 32;
}

upstream webscada_backend {
    server webscada-backend:3001 fail_timeout=30s max_fails=3;
    keepalive 32;
}
```

**OR** expose ports on host and proxy to localhost:

In `docker-compose.vps.yml`, change from `expose:` to `ports:`:

```yaml
backend:
  ports:
    - '127.0.0.1:3001:3001' # Bind to localhost only

frontend:
  ports:
    - '127.0.0.1:3000:3000' # Bind to localhost only
```

### Rate Limiting

The configuration includes rate limiting:

- API requests: 10 requests/second
- WebSocket connections: 30 requests/second
- Connection limit: 50 concurrent connections per IP

Adjust these in `/etc/nginx/sites-available/webscada.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
```

---

## SSL Certificate Setup

### Let's Encrypt Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d webscada.yourdomain.com

# Or use standalone mode
sudo certbot certonly --standalone -d webscada.yourdomain.com
```

### Certificate Renewal

Certbot sets up automatic renewal. To test:

```bash
# Dry run renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

### Custom Certificate

If using a purchased certificate:

```bash
# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/certs/webscada.crt
sudo cp your-private-key.key /etc/ssl/private/webscada.key
sudo chmod 600 /etc/ssl/private/webscada.key

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/webscada.conf
```

---

## Monitoring & Maintenance

### Check Container Health

```bash
# Status overview
sudo ./deploy-vps.sh status

# Resource usage
docker stats

# Detailed info
docker inspect webscada-backend
```

### View Logs

```bash
# All services
sudo ./deploy-vps.sh logs

# Specific service
docker logs -f webscada-backend
docker logs -f webscada-frontend --tail=100

# Nginx logs
sudo tail -f /var/log/nginx/webscada_access.log
sudo tail -f /var/log/nginx/webscada_error.log
```

### Performance Monitoring

```bash
# Container resource usage
docker stats --no-stream

# System resources
htop
df -h
free -h
```

### Log Rotation

Logs are automatically rotated via configuration in `/etc/logrotate.d/webscada`:

```
/var/log/webscada/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 root root
}
```

---

## Backup & Recovery

### Automated Backups

```bash
# Create backup
sudo ./deploy-vps.sh backup
```

This creates:

- PostgreSQL database dump
- Docker volume snapshots
- Combined archive in `/var/backups/webscada/`

### Setup Automated Backup Schedule

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/webscada/deploy-vps.sh backup >> /var/log/webscada/backup.log 2>&1
```

### Restore from Backup

```bash
# List backups
ls -lh /var/backups/webscada/

# Restore
sudo ./deploy-vps.sh restore
# Follow prompts to select backup file
```

### Manual Database Backup

```bash
# Backup
docker exec webscada-postgres pg_dump -U webscada webscada > backup.sql

# Restore
docker exec -i webscada-postgres psql -U webscada webscada < backup.sql
```

---

## Security Best Practices

### 1. Strong Passwords

Ensure all passwords in `.env.production` are strong and unique:

```bash
# Generate secure passwords
openssl rand -base64 32
```

### 2. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8080/tcp # WebSCADA HTTP
sudo ufw allow 8443/tcp # WebSCADA HTTPS

# Deny all other incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### 3. SSH Security

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Use SSH keys instead of passwords
# Disable password authentication:
# Set: PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

### 4. Update Regularly

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Update Docker images
cd /opt/webscada
sudo ./deploy-vps.sh deploy
```

### 5. Monitor Access Logs

```bash
# Watch for suspicious activity
sudo tail -f /var/log/nginx/webscada_access.log | grep -E "POST|DELETE"
sudo fail2ban-client status nginx-http-auth
```

### 6. Enable Fail2Ban

```bash
# Install Fail2Ban
sudo apt-get install fail2ban

# Configure for Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add Nginx jail
[nginx-http-auth]
enabled = true
port = http,https,8080,8443
logpath = /var/log/nginx/webscada_error.log

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

---

## Troubleshooting

### Issue: Containers Won't Start

**Solution:**

```bash
# Check logs
docker logs webscada-backend

# Check environment variables
docker exec webscada-backend env

# Restart services
sudo ./deploy-vps.sh restart
```

### Issue: Cannot Access via Domain

**Checklist:**

1. DNS points to VPS IP: `dig webscada.yourdomain.com`
2. Nginx is running: `sudo systemctl status nginx`
3. Firewall allows ports: `sudo ufw status`
4. Containers are running: `docker ps`
5. Nginx configuration is valid: `sudo nginx -t`

### Issue: 502 Bad Gateway

**Causes:**

- Backend container not running
- Wrong upstream configuration in Nginx
- Container can't connect to database

**Solution:**

```bash
# Check container status
docker ps -a

# Check backend logs
docker logs webscada-backend

# Restart backend
docker restart webscada-backend

# Check Nginx configuration
sudo nginx -t
```

### Issue: WebSocket Connection Fails

**Solution:**

Update Nginx configuration to properly handle WebSocket:

```nginx
location /socket.io {
    proxy_pass http://webscada_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... other headers
}
```

### Issue: Database Connection Error

**Solution:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs webscada-postgres

# Test connection
docker exec webscada-postgres psql -U webscada -d webscada -c "SELECT version();"

# Verify DATABASE_URL in .env.production
```

### Issue: Out of Memory

**Solution:**

```bash
# Check memory usage
free -h
docker stats

# Adjust container limits in docker-compose.vps.yml:
deploy:
  resources:
    limits:
      memory: 512M  # Reduce if needed
```

### Issue: Port Already in Use

**Solution:**

```bash
# Check what's using the port
sudo lsof -i :8080
sudo lsof -i :8443

# Use different ports or stop conflicting service
# Update Nginx configuration accordingly
```

---

## Performance Tuning

### Docker Resource Limits

Adjust in `docker-compose.vps.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

### PostgreSQL Tuning

```bash
# Edit PostgreSQL configuration
docker exec -it webscada-postgres bash
vi /var/lib/postgresql/data/postgresql.conf

# Recommended settings for 4GB RAM VPS:
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
max_connections = 100
```

### Redis Tuning

Already configured in `docker-compose.vps.yml`:

```yaml
redis:
  command: >
    redis-server
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
```

### Nginx Tuning

Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 10M;
```

---

## Scaling

### Horizontal Scaling

To add more backend instances:

```yaml
# In docker-compose.vps.yml
backend:
  deploy:
    replicas: 2 # Run 2 instances
```

Update Nginx upstream:

```nginx
upstream webscada_backend {
    server webscada-backend-1:3001;
    server webscada-backend-2:3001;
    keepalive 32;
}
```

### Vertical Scaling

Upgrade VPS resources and adjust container limits accordingly.

---

## Useful Commands

```bash
# Deployment
sudo ./deploy-vps.sh deploy      # Deploy/update
sudo ./deploy-vps.sh start       # Start services
sudo ./deploy-vps.sh stop        # Stop services
sudo ./deploy-vps.sh restart     # Restart services
sudo ./deploy-vps.sh status      # Show status
sudo ./deploy-vps.sh logs        # View logs

# Backup/Restore
sudo ./deploy-vps.sh backup      # Create backup
sudo ./deploy-vps.sh restore     # Restore from backup

# Docker
docker ps                        # List containers
docker logs webscada-backend     # View logs
docker exec -it webscada-backend bash  # Shell access
docker stats                     # Resource usage

# Nginx
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload Nginx
sudo tail -f /var/log/nginx/webscada_access.log  # Access logs

# Database
docker exec webscada-postgres psql -U webscada webscada  # PostgreSQL shell
docker exec webscada-redis redis-cli -a $REDIS_PASSWORD  # Redis shell
```

---

## Support & Additional Resources

- **Project Documentation**: `/documents/` directory
- **API Documentation**: `/documents/api/endpoints.md`
- **Architecture Overview**: `/documents/architecture/overview.md`
- **Troubleshooting**: This guide's Troubleshooting section

---

## Quick Reference Checklist

### Pre-Deployment

- [ ] VPS meets minimum requirements
- [ ] Domain DNS configured
- [ ] SSH access configured
- [ ] Backup plan in place

### Initial Setup

- [ ] Run `./deploy-vps.sh setup`
- [ ] Configure `.env.production`
- [ ] Generate strong passwords
- [ ] Configure Nginx
- [ ] Setup SSL certificate
- [ ] Configure firewall

### Deployment

- [ ] Run `./deploy-vps.sh deploy`
- [ ] Verify all containers running
- [ ] Test web access
- [ ] Test API endpoints
- [ ] Check logs for errors

### Post-Deployment

- [ ] Setup automated backups
- [ ] Configure monitoring
- [ ] Test backup/restore
- [ ] Document custom configuration
- [ ] Setup alerts (optional)

---

## Conclusion

Your WebSCADA application should now be successfully deployed on your Hostinger VPS, running alongside your existing Nginx setup without conflicts.

For issues or questions:

1. Check the Troubleshooting section
2. Review container logs
3. Verify configuration files
4. Check system resources

**Happy monitoring!**
