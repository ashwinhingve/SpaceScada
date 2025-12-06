# WebSCADA Ubuntu VPS - All Fixes Applied ✅

## Summary

All deployment issues have been fixed and the application is now fully configured for Ubuntu VPS deployment!

## What Was Fixed

### 1. ✅ Docker Credential Helper Error
**Problem:** Docker config referenced Docker Desktop credential helper that doesn't exist on Linux
```
error getting credentials - err: exec: "docker-credential-desktop.exe": executable file not found
```
**Fix:** Removed Desktop credential helper from `/root/.docker/config.json`

### 2. ✅ Redis Connection Failures (URL Encoding)
**Problem:** REDIS_PASSWORD contained `/` character causing URL parsing errors
```
Error: ECONNREFUSED connecting to redis://...
```
**Fix:** Generated URL-safe password (alphanumeric only) in `.env.production`

### 3. ✅ Missing Database Tables
**Problem:** ESP32 devices tables didn't exist, causing backend crashes
```
ERROR: relation "esp32_devices" does not exist
```
**Fix:** Created migration `011_esp32_devices_schema.sql` and ran all migrations

### 4. ✅ Health Check Command Format
**Problem:** Health checks used `CMD` format with shell operators that don't work
```
wget: bad address '||'
```
**Fix:** Changed to `CMD-SHELL` format in `docker-compose.vps.yml`:
```yaml
healthcheck:
  test: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health || exit 1']
```

### 5. ✅ IPv4/IPv6 Connectivity Issues
**Problem:** Health checks used `localhost` which resolved to IPv6 `::1`, but services listen on IPv4
**Fix:** Changed health checks to use explicit IPv4 address `127.0.0.1`

### 6. ✅ Environment Variable Warnings
**Problem:** `deploy-vps.sh status` and `logs` commands didn't load `.env.production`
**Fix:** Added `--env-file "$ENV_FILE"` to both commands

### 7. ✅ Docker Compose Version Warning
**Problem:** Obsolete `version: '3.9'` directive in docker-compose.vps.yml
**Fix:** Removed deprecated version line

## Files Modified

1. **`.env.production`**
   - Updated REDIS_PASSWORD to URL-safe format

2. **`docker-compose.vps.yml`**
   - Removed obsolete `version` directive
   - Fixed health check commands (CMD → CMD-SHELL)
   - Changed localhost → 127.0.0.1

3. **`deploy-vps.sh`**
   - Added `--env-file` to `status` command
   - Added `--env-file` to `logs` command

4. **`apps/backend/migrations/011_esp32_devices_schema.sql`** (NEW)
   - Created ESP32 devices table migration

## Files Created for Ubuntu VPS

1. **`UBUNTU-VPS-DEPLOYMENT.md`** - Complete deployment guide
2. **`check-vps-compatibility.sh`** - Pre-deployment system check script
3. **`DEPLOYMENT-FIXES-SUMMARY.md`** - This file

## Current Status

### All Services Running ✅
```
✓ webscada-backend     (healthy)  - Backend API on 127.0.0.1:3001
✓ webscada-frontend    (healthy)  - Next.js UI on 127.0.0.1:3000
✓ webscada-postgres    (healthy)  - PostgreSQL Database
✓ webscada-redis       (healthy)  - Redis Cache
✓ webscada-mosquitto   (healthy)  - MQTT Broker
✓ webscada-realtime    (running)  - Realtime Service on 127.0.0.1:3002
```

### Verified Endpoints
- Backend: http://127.0.0.1:3001/health → `{"status":"ok"}`
- Frontend: http://127.0.0.1:3000/ → WebSCADA UI
- Realtime: http://127.0.0.1:3002/api/health → Working

## Deploying to Ubuntu VPS

### Quick Start

On your Ubuntu VPS:

```bash
# 1. Clone repository
git clone <your-repo-url>
cd webscada

# 2. Check compatibility
bash check-vps-compatibility.sh

# 3. Run setup
sudo ./deploy-vps.sh setup

# 4. Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your settings

# 5. Deploy
sudo ./deploy-vps.sh deploy
```

### Important Configuration Notes

#### ⚠️ Critical: REDIS_PASSWORD Format
**ALWAYS use alphanumeric passwords only!**

❌ Bad (contains `/`):
```bash
REDIS_PASSWORD=abc123/def456
```

✅ Good (alphanumeric only):
```bash
REDIS_PASSWORD=abc123def456XYZ789
```

Generate safe password:
```bash
openssl rand -base64 32 | tr -d '/+='
```

#### Environment Variables (.env.production)

Required settings for Ubuntu VPS:

```bash
# Your VPS domain
DOMAIN=your-vps-domain.com
CORS_ORIGIN=https://your-vps-domain.com

# Frontend URLs
NEXT_PUBLIC_API_URL=https://your-vps-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-vps-domain.com

# Database (use strong alphanumeric password)
POSTGRES_PASSWORD=<strong-alphanumeric-password>

# Redis (MUST be alphanumeric only!)
REDIS_PASSWORD=<strong-alphanumeric-password>

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
```

## Management Commands

```bash
# Check status (shows all containers and health)
sudo ./deploy-vps.sh status

# View logs (follows in real-time)
sudo ./deploy-vps.sh logs

# Restart all services
sudo ./deploy-vps.sh restart

# Start services
sudo ./deploy-vps.sh start

# Stop services
sudo ./deploy-vps.sh stop

# Create backup
sudo ./deploy-vps.sh backup

# Restore from backup
sudo ./deploy-vps.sh restore
```

## Troubleshooting

### If Backend Shows Unhealthy

1. Wait 30-40 seconds for health checks to initialize
2. Check logs: `sudo docker logs webscada-backend`
3. Verify database migrations ran:
   ```bash
   sudo docker exec webscada-postgres psql -U webscada -d webscada -c "\dt"
   ```
4. If tables missing, run migrations manually:
   ```bash
   for file in apps/backend/migrations/*.sql; do
     sudo docker exec -i webscada-postgres psql -U webscada -d webscada < "$file"
   done
   ```

### If Frontend Won't Start

Frontend depends on backend being healthy:

```bash
# 1. Check backend health
curl http://127.0.0.1:3001/health

# 2. If backend healthy, start frontend
sudo docker start webscada-frontend
```

### Performance Tuning for Small VPS

If running on a VPS with limited resources (1GB RAM):

1. Enable swap:
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. Reduce container limits in `docker-compose.vps.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

## Security Checklist for Production VPS

- [ ] Changed all default passwords in `.env.production`
- [ ] Used strong alphanumeric passwords (no special chars)
- [ ] Generated secure JWT_SECRET (32+ characters)
- [ ] Configured firewall (UFW)
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Setup SSL with Let's Encrypt
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d your-domain.com
  ```
- [ ] Configured Nginx reverse proxy
- [ ] Setup automated backups (cron job)
- [ ] Enabled log rotation
- [ ] Updated system packages

## Monitoring

### Health Checks
```bash
# All services
sudo ./deploy-vps.sh status

# Specific endpoints
curl http://127.0.0.1:3001/health  # Backend
curl http://127.0.0.1:3000/        # Frontend
curl http://127.0.0.1:3002/api/health  # Realtime
```

### Resource Usage
```bash
# Container stats
sudo docker stats

# System resources
free -h      # Memory
df -h        # Disk
top          # CPU
```

## Next Steps

1. **Read Full Documentation:**
   - `UBUNTU-VPS-DEPLOYMENT.md` - Complete deployment guide
   - `documents/DEPLOYMENT.md` - General deployment info

2. **Configure Nginx:**
   - Copy config: `sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/`
   - Enable site: `sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/`
   - Test: `sudo nginx -t`
   - Reload: `sudo systemctl reload nginx`

3. **Setup SSL:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

4. **Configure Backups:**
   ```bash
   # Add to crontab for daily backups at 2 AM
   sudo crontab -e
   # Add: 0 2 * * * cd /path/to/webscada && ./deploy-vps.sh backup
   ```

## Support

If you encounter issues:

1. Run compatibility check: `bash check-vps-compatibility.sh`
2. Check logs: `sudo ./deploy-vps.sh logs`
3. Check status: `sudo ./deploy-vps.sh status`
4. Review documentation: `UBUNTU-VPS-DEPLOYMENT.md`
5. Check container logs individually:
   ```bash
   sudo docker logs webscada-backend
   sudo docker logs webscada-frontend
   sudo docker logs webscada-postgres
   ```

## Success Indicators

Your deployment is successful when:

✅ All 6 containers show as running
✅ Backend and frontend show as "healthy"
✅ Backend health endpoint returns `{"status":"ok"}`
✅ Frontend serves the WebSCADA UI
✅ No errors in logs
✅ Services accessible via Nginx (if configured)

---

**🎉 WebSCADA is now ready for Ubuntu VPS deployment!**

All issues have been fixed, documentation created, and the system is production-ready.
