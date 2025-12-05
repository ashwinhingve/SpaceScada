# WebSCADA Production Deployment Guide

Complete guide for deploying WebSCADA on Ubuntu VPS with Nginx.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Deployment Steps](#deployment-steps)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL Setup](#ssl-setup)
7. [Security](#security)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

For experienced users who want to deploy quickly:

### 1. Prepare VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone and navigate
cd /opt
git clone <your-repo> webscada
cd webscada

# Make deployment script executable
chmod +x deploy-vps.sh

# Run initial setup
sudo ./deploy-vps.sh setup
```

### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.production.example .env.production
nano .env.production
```

**Required Changes:**

- Set `DOMAIN` to your domain name
- Generate strong passwords:
  - `POSTGRES_PASSWORD` (use: `openssl rand -base64 24`)
  - `REDIS_PASSWORD` (use: `openssl rand -base64 24`)
  - `JWT_SECRET` (use: `openssl rand -base64 32`)
- Set `CORS_ORIGIN` to your domain
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`

### 3. Configure Nginx

```bash
# Copy and edit Nginx configuration
sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/webscada.conf
sudo nano /etc/nginx/sites-available/webscada.conf
```

Update:
- Replace `webscada.yourdomain.com` with your domain
- Update SSL certificate paths

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Setup SSL (Recommended)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d webscada.yourdomain.com
```

### 5. Deploy

```bash
sudo ./deploy-vps.sh deploy
```

### 6. Verify

```bash
sudo ./deploy-vps.sh status
curl http://localhost:3000
curl http://localhost:3001/health
```

Access at: `https://webscada.yourdomain.com:8443`

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

- SSH access with root/sudo privileges
- Domain DNS configured
- (Optional) SSL certificates or Let's Encrypt access

---

## Architecture Overview

### Port Mapping

| Service          | Internal Port | Host Binding   | External Access       |
| ---------------- | ------------- | -------------- | --------------------- |
| Frontend         | 3000          | 127.0.0.1:3000 | Via Nginx (8080/8443) |
| Backend API      | 3001          | 127.0.0.1:3001 | Via Nginx (8080/8443) |
| Realtime Service | 3002          | 127.0.0.1:3002 | Via Nginx (8080/8443) |
| PostgreSQL       | 5432          | Internal only  | Docker network only   |
| Redis            | 6379          | Internal only  | Docker network only   |
| Mosquitto MQTT   | 1883          | Internal only  | Docker network only   |

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
└─────────────────────────────────────────┘
```

**Key Points:**

- All services bind to localhost only (127.0.0.1)
- No direct external access to services
- All traffic routed through Nginx reverse proxy
- Your existing websites on ports 80/443 remain unaffected

---

## Deployment Steps

### Step 1: Connect to VPS

```bash
ssh root@your-vps-ip
# Or with sudo user:
ssh your-user@your-vps-ip
```

### Step 2: Clone Repository

```bash
cd /opt
git clone <your-repository-url> webscada
cd webscada
```

### Step 3: Run Initial Setup

```bash
# Make deployment script executable
chmod +x deploy-vps.sh

# Run VPS setup
sudo ./deploy-vps.sh setup
```

This command will:
- Update system packages
- Install Docker and Docker Compose
- Create backup and log directories
- Set up log rotation
- Create environment file template

### Step 4: Configure Environment

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

### Step 5: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (existing sites)
sudo ufw allow 443/tcp     # HTTPS (existing sites)
sudo ufw allow 8080/tcp    # WebSCADA HTTP
sudo ufw allow 8443/tcp    # WebSCADA HTTPS

# Check status
sudo ufw status
```

### Step 6: Deploy Application

```bash
# Deploy the application
sudo ./deploy-vps.sh deploy
```

This will:
1. Build Docker images
2. Start all containers
3. Wait for services to be healthy
4. Show deployment status

### Step 7: Verify Deployment

```bash
# Check container status
sudo ./deploy-vps.sh status

# View logs
sudo ./deploy-vps.sh logs

# Test internal access
curl http://localhost:3000
curl http://localhost:3001/health
```

### Step 8: Test External Access

- **Web Interface**: `https://webscada.yourdomain.com:8443`
- **API Health**: `https://webscada.yourdomain.com:8443/api/health`
- **Backend Health**: `https://webscada.yourdomain.com:8443/health`

---

## Nginx Configuration

### Copy Configuration

```bash
# Copy Nginx configuration
sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/webscada.conf

# Edit the configuration
sudo nano /etc/nginx/sites-available/webscada.conf
```

### Update Server Name

```nginx
# Change server_name to your domain
server_name webscada.yourdomain.com;
```

### Update SSL Paths (if using SSL)

```nginx
ssl_certificate /etc/letsencrypt/live/webscada.yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/webscada.yourdomain.com/privkey.pem;
```

### Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Rate Limiting

The configuration includes rate limiting:

- API requests: 10 requests/second
- WebSocket connections: 30 requests/second
- Connection limit: 50 concurrent connections per IP

Adjust in `/etc/nginx/sites-available/webscada.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
```

---

## SSL Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d webscada.yourdomain.com

# Or use standalone mode
sudo certbot certonly --standalone -d webscada.yourdomain.com

# Enable auto-renewal (automatic with Certbot)
sudo systemctl enable certbot.timer
```

### Test Certificate Renewal

```bash
# Dry run renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

### Using Custom Certificate

If using a purchased certificate:

```bash
# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/certs/webscada.crt
sudo cp your-private-key.key /etc/ssl/private/webscada.key
sudo chmod 600 /etc/ssl/private/webscada.key

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/webscada.conf
```

Update certificate paths:

```nginx
ssl_certificate /etc/ssl/certs/webscada.crt;
ssl_certificate_key /etc/ssl/private/webscada.key;
```

---

## Security

### 1. Strong Passwords

Ensure all passwords in `.env.production` are strong and unique:

```bash
# Generate secure passwords (32 characters)
openssl rand -base64 32
```

### 2. SSH Security

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

### 3. Firewall Rules

```bash
# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8080/tcp # WebSCADA HTTP
sudo ufw allow 8443/tcp # WebSCADA HTTPS

# Enable firewall
sudo ufw enable
```

### 4. Fail2Ban Protection

```bash
# Install Fail2Ban
sudo apt-get install fail2ban

# Configure for Nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Add Nginx jail:

```ini
[nginx-http-auth]
enabled = true
port = http,https,8080,8443
logpath = /var/log/nginx/webscada_error.log
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 5. Regular Updates

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Update Docker images
cd /opt/webscada
sudo ./deploy-vps.sh deploy
```

### 6. Monitor Access Logs

```bash
# Watch for suspicious activity
sudo tail -f /var/log/nginx/webscada_access.log | grep -E "POST|DELETE"
```

---

## Monitoring & Maintenance

### Check Container Health

```bash
# Status overview
sudo ./deploy-vps.sh status

# Resource usage
docker stats

# Detailed container info
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

Logs are automatically rotated via `/etc/logrotate.d/webscada`:

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

## Troubleshooting

### Containers Won't Start

**Solution:**

```bash
# Check logs
docker logs webscada-backend

# Check environment variables
docker exec webscada-backend env

# Restart services
sudo ./deploy-vps.sh restart
```

### Cannot Access via Domain

**Checklist:**

1. DNS points to VPS IP: `dig webscada.yourdomain.com`
2. Nginx is running: `sudo systemctl status nginx`
3. Firewall allows ports: `sudo ufw status`
4. Containers are running: `docker ps`
5. Nginx configuration is valid: `sudo nginx -t`

### 502 Bad Gateway

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

### WebSocket Connection Fails

**Solution:**

Ensure Nginx configuration properly handles WebSocket:

```nginx
location /socket.io {
    proxy_pass http://webscada_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Database Connection Error

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

### Out of Memory

**Solution:**

```bash
# Check memory usage
free -h
docker stats

# Adjust container limits in docker-compose.vps.yml
deploy:
  resources:
    limits:
      memory: 512M  # Reduce if needed
```

### Port Already in Use

**Solution:**

```bash
# Check what's using the port
sudo lsof -i :8080
sudo lsof -i :8443

# Use different ports or stop conflicting service
```

---

## Management Commands

### Deployment Commands

```bash
sudo ./deploy-vps.sh deploy      # Deploy/update application
sudo ./deploy-vps.sh start       # Start all services
sudo ./deploy-vps.sh stop        # Stop all services
sudo ./deploy-vps.sh restart     # Restart all services
sudo ./deploy-vps.sh status      # Show status
sudo ./deploy-vps.sh logs        # View logs
```

### Backup/Restore Commands

```bash
sudo ./deploy-vps.sh backup      # Create backup
sudo ./deploy-vps.sh restore     # Restore from backup
```

### Docker Commands

```bash
docker ps                        # List containers
docker logs webscada-backend     # View logs
docker exec -it webscada-backend bash  # Shell access
docker stats                     # Resource usage
```

### Nginx Commands

```bash
sudo nginx -t                    # Test configuration
sudo systemctl reload nginx      # Reload Nginx
sudo tail -f /var/log/nginx/webscada_access.log  # Access logs
```

### Database Commands

```bash
# PostgreSQL shell
docker exec webscada-postgres psql -U webscada webscada

# Redis shell
docker exec webscada-redis redis-cli -a $REDIS_PASSWORD
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
```

Recommended settings for 4GB RAM VPS:

```ini
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

## Additional Resources

- **Architecture Documentation**: `documents/architecture/`
- **API Documentation**: `documents/api/`
- **Nginx Configuration**: `infrastructure/nginx/webscada.conf`
- **Docker Compose**: `docker-compose.vps.yml`

---

## Support

For issues:

1. Check logs: `docker logs <container-name>`
2. Review configuration files
3. Verify environment variables
4. Check system resources
5. Consult troubleshooting section above

---

**Happy deploying!**
