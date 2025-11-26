# WebSCADA VPS Deployment - Quick Start

## What Was Prepared

Your WebSCADA application has been configured for deployment on a Hostinger Ubuntu VPS with existing Nginx. All necessary files have been created:

### Created Files

1. **docker-compose.vps.yml** - VPS-optimized Docker Compose configuration
2. **infrastructure/nginx/webscada.conf** - Nginx reverse proxy configuration
3. **.env.production.example** - Production environment variable template
4. **deploy-vps.sh** - Automated deployment script
5. **VPS-DEPLOYMENT-GUIDE.md** - Comprehensive deployment documentation
6. **infrastructure/docker/realtime-service.Dockerfile** - Realtime service Docker image

## Port Configuration

The application uses non-standard ports to avoid conflicts with existing Nginx:

| Service  | Internal Port | Host Binding   | External Access        |
| -------- | ------------- | -------------- | ---------------------- |
| Frontend | 3000          | 127.0.0.1:3000 | Via Nginx on 8080/8443 |
| Backend  | 3001          | 127.0.0.1:3001 | Via Nginx on 8080/8443 |
| Realtime | 3002          | 127.0.0.1:3002 | Via Nginx on 8080/8443 |
| Database | 5432          | Internal only  | Docker network only    |
| Redis    | 6379          | Internal only  | Docker network only    |
| MQTT     | 1883          | Internal only  | Docker network only    |

**Key Points:**

- All services bind to localhost only (127.0.0.1)
- No direct external access to services
- All traffic goes through Nginx reverse proxy
- Your existing websites on ports 80/443 remain unaffected

## Quick Deployment Steps

### 1. Prepare VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to deployment directory
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
- Generate and set strong passwords for:
  - `POSTGRES_PASSWORD`
  - `REDIS_PASSWORD`
  - `JWT_SECRET` (use: `openssl rand -base64 32`)
- Set `CORS_ORIGIN` to your domain
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`

### 3. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/webscada.conf

# Edit configuration
sudo nano /etc/nginx/sites-available/webscada.conf
```

**Update:**

- Replace `webscada.yourdomain.com` with your actual domain
- Update SSL certificate paths (if using SSL)

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d webscada.yourdomain.com

# Auto-renewal is configured automatically
```

### 5. Deploy Application

```bash
# Deploy the application
sudo ./deploy-vps.sh deploy
```

This will:

- Build Docker images
- Start all containers
- Run health checks
- Show deployment status

### 6. Verify Deployment

```bash
# Check container status
sudo ./deploy-vps.sh status

# View logs
sudo ./deploy-vps.sh logs

# Test access
curl http://localhost:3000
curl http://localhost:3001/health
```

**Web Access:**

- HTTP: `http://webscada.yourdomain.com:8080`
- HTTPS: `https://webscada.yourdomain.com:8443`
- API: `https://webscada.yourdomain.com:8443/api`

## Management Commands

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

# Help
./deploy-vps.sh help            # Show all commands
```

## Firewall Configuration

```bash
# Enable firewall
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

## Automated Backups

```bash
# Setup daily backup at 2 AM
sudo crontab -e

# Add this line:
0 2 * * * /opt/webscada/deploy-vps.sh backup >> /var/log/webscada/backup.log 2>&1
```

## Troubleshooting Quick Fixes

### Containers won't start

```bash
# Check logs
docker logs webscada-backend
docker logs webscada-frontend

# Restart
sudo ./deploy-vps.sh restart
```

### Cannot access via domain

```bash
# Check DNS
dig webscada.yourdomain.com

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check containers
docker ps
```

### 502 Bad Gateway

```bash
# Check backend
docker logs webscada-backend

# Restart backend
docker restart webscada-backend
```

### Database connection error

```bash
# Check PostgreSQL
docker ps | grep postgres
docker logs webscada-postgres

# Test connection
docker exec webscada-postgres psql -U webscada -d webscada -c "SELECT 1;"
```

## Security Checklist

- [ ] Changed all default passwords in .env.production
- [ ] SSL certificate configured and working
- [ ] Firewall (UFW) enabled and configured
- [ ] Automated backups scheduled
- [ ] Log rotation configured (done by setup script)
- [ ] SSH key authentication enabled (disable password auth)
- [ ] Regular updates scheduled

## Resource Monitoring

```bash
# Container resource usage
docker stats

# System resources
htop
df -h
free -h

# Logs
sudo tail -f /var/log/nginx/webscada_access.log
docker logs -f webscada-backend
```

## Important Notes

1. **Port Binding**: Services are bound to localhost (127.0.0.1) only, not accessible from outside
2. **Nginx Proxy**: All external traffic goes through Nginx on ports 8080/8443
3. **Existing Nginx**: Your existing sites on ports 80/443 are unaffected
4. **Database**: PostgreSQL and Redis are internal only, not exposed to host
5. **Security**: Always use SSL in production (configure in Nginx)

## Next Steps After Deployment

1. Test all endpoints and functionality
2. Setup monitoring (optional: Grafana/Prometheus)
3. Configure automated backups
4. Set up log monitoring and alerts
5. Document any custom configurations
6. Test backup/restore procedure

## Need Help?

- **Full Documentation**: See `VPS-DEPLOYMENT-GUIDE.md`
- **Architecture**: See `documents/architecture/overview.md`
- **API Docs**: See `documents/api/endpoints.md`
- **Troubleshooting**: See troubleshooting section in `VPS-DEPLOYMENT-GUIDE.md`

## Files Reference

```
webscada/
├── docker-compose.vps.yml              # VPS Docker Compose config
├── .env.production                      # Production environment (create from .example)
├── .env.production.example              # Environment template
├── deploy-vps.sh                        # Deployment script
├── VPS-DEPLOYMENT-GUIDE.md              # Full deployment guide (this file)
├── VPS-DEPLOYMENT-QUICKSTART.md         # Quick start (this file)
└── infrastructure/
    ├── nginx/
    │   └── webscada.conf                # Nginx configuration
    └── docker/
        ├── backend.Dockerfile
        ├── frontend.Dockerfile
        ├── realtime-service.Dockerfile
        └── simulator.Dockerfile
```

## Support

For issues:

1. Check logs: `docker logs <container-name>`
2. Review configuration files
3. Verify environment variables
4. Check system resources
5. Consult full documentation in `VPS-DEPLOYMENT-GUIDE.md`

---

**Ready to deploy? Run:** `sudo ./deploy-vps.sh setup`
