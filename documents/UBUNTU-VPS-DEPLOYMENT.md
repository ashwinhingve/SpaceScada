# WebSCADA Ubuntu VPS Deployment Guide

Complete guide for deploying WebSCADA on Ubuntu VPS (tested on Ubuntu 22.04/24.04).

## Prerequisites

- Ubuntu VPS 22.04 or 24.04 LTS
- Minimum 2GB RAM, 2 CPU cores, 20GB storage
- Root or sudo access
- Domain name (optional, for HTTPS)

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd webscada

# 2. Make deployment script executable
chmod +x deploy-vps.sh

# 3. Run initial setup (installs Docker, configures system)
sudo ./deploy-vps.sh setup

# 4. Configure environment variables
cp .env.production.example .env.production
nano .env.production  # Edit with your settings

# 5. Deploy the application
sudo ./deploy-vps.sh deploy
```

## Detailed Setup Instructions

### Step 1: System Preparation

Update your system:
```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Docker (Automated)

The setup script handles Docker installation:
```bash
sudo ./deploy-vps.sh setup
```

This will:
- Install Docker CE and Docker Compose
- Create necessary directories
- Setup log rotation
- Configure system services

### Step 3: Environment Configuration

Edit `.env.production` with your settings:

```bash
# Required settings
DOMAIN=your-domain.com
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com

# Generate secure passwords (use alphanumeric only, no special chars like /)
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
JWT_SECRET=<random-base64-string>

# Generate JWT secret:
openssl rand -base64 32
```

**IMPORTANT:** Use only alphanumeric passwords for REDIS_PASSWORD to avoid URL encoding issues!

### Step 4: Configure Nginx (If Using Reverse Proxy)

Copy the Nginx configuration:
```bash
sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/
```

Edit the configuration:
```bash
sudo nano /etc/nginx/sites-available/webscada.conf
# Update server_name with your domain
```

Test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Deploy Application

```bash
sudo ./deploy-vps.sh deploy
```

This will:
- Pull Docker images
- Build custom images
- Start all services
- Run database migrations

### Step 6: SSL Certificate (Optional)

Install Let's Encrypt certificate:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Service Management

### Check Status
```bash
sudo ./deploy-vps.sh status
```

### View Logs
```bash
sudo ./deploy-vps.sh logs
```

### Restart Services
```bash
sudo ./deploy-vps.sh restart
```

### Start Services
```bash
sudo ./deploy-vps.sh start
```

### Stop Services
```bash
sudo ./deploy-vps.sh stop
```

## Container Health Status

All containers should show as "healthy":

```
webscada-backend     - (healthy) - Backend API
webscada-frontend    - (healthy) - Next.js Frontend
webscada-postgres    - (healthy) - PostgreSQL Database
webscada-redis       - (healthy) - Redis Cache
webscada-mosquitto   - (healthy) - MQTT Broker
webscada-realtime    - UP        - Realtime Service
```

## Troubleshooting

### Backend Shows Unhealthy

Check backend logs:
```bash
sudo docker logs webscada-backend --tail 50
```

Common issues:
1. **Database not ready**: Wait 30-40 seconds for health checks to pass
2. **Redis connection failed**: Check REDIS_PASSWORD doesn't contain special characters
3. **Missing tables**: Run migrations manually:
   ```bash
   for file in apps/backend/migrations/*.sql; do
     sudo docker exec -i webscada-postgres psql -U webscada -d webscada < "$file"
   done
   ```

### Frontend Won't Start

Frontend depends on backend being healthy. Check:
```bash
# Check backend health
curl http://127.0.0.1:3001/health

# If backend is healthy, start frontend manually
sudo docker start webscada-frontend
```

### Health Check Issues

If health checks fail after deployment:
1. Verify health check commands work:
   ```bash
   sudo docker exec webscada-backend wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health
   ```
2. Check if wget is installed in containers (it should be)
3. Ensure services are listening on 0.0.0.0, not just localhost

### Port Already in Use

If ports 3000, 3001, or 3002 are in use:
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Stop the conflicting service or change ports in docker-compose.vps.yml
```

## Performance Optimization

### Adjust Container Resources

Edit `docker-compose.vps.yml` to match your VPS specs:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # Adjust based on your VPS
      memory: 2G
```

### Enable Swap (If Limited RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Backup and Restore

### Create Backup
```bash
sudo ./deploy-vps.sh backup
```

Backups are stored in `/var/backups/webscada/`

### Restore from Backup
```bash
sudo ./deploy-vps.sh restore
```

## Monitoring

### Container Stats
```bash
sudo docker stats
```

### Service Health
```bash
# Backend
curl http://127.0.0.1:3001/health

# Frontend
curl http://127.0.0.1:3000/

# Realtime
curl http://127.0.0.1:3002/api/health
```

### System Resources
```bash
# Memory usage
free -h

# Disk usage
df -h

# CPU usage
top
```

## Firewall Configuration

Configure UFW firewall:
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (change 22 to your SSH port if different)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## Security Recommendations

1. **Change default passwords** in `.env.production`
2. **Use strong JWT secret** (minimum 32 characters)
3. **Enable firewall** (UFW)
4. **Use HTTPS** with Let's Encrypt
5. **Regular updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
6. **Regular backups**:
   ```bash
   # Add to crontab for daily backups
   sudo crontab -e
   # Add: 0 2 * * * cd /path/to/webscada && ./deploy-vps.sh backup
   ```

## Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
sudo ./deploy-vps.sh deploy
```

## Complete Cleanup (CAUTION)

To remove all containers and data:
```bash
sudo ./deploy-vps.sh clean
```

**WARNING:** This deletes all data permanently!

## Common Issues on Ubuntu VPS

### Issue: Docker not starting
**Solution:**
```bash
sudo systemctl status docker
sudo systemctl start docker
sudo systemctl enable docker
```

### Issue: Permission denied
**Solution:**
```bash
# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: Out of disk space
**Solution:**
```bash
# Clean up Docker
sudo docker system prune -a --volumes

# Check disk usage
df -h
du -sh /var/lib/docker
```

## Support

For issues or questions:
1. Check logs: `sudo ./deploy-vps.sh logs`
2. Check status: `sudo ./deploy-vps.sh status`
3. Review this documentation
4. Check GitHub issues

## Architecture

```
Internet → Nginx (80/443) → Docker Network
                              ├─ Frontend (3000)
                              ├─ Backend (3001)
                              ├─ Realtime (3002)
                              ├─ PostgreSQL (5432)
                              ├─ Redis (6379)
                              └─ Mosquitto (1883, 9001)
```

All services run in isolated Docker containers on an internal network, with only Nginx exposed to the internet.
