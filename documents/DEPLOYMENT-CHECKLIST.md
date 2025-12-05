# WebSCADA Deployment Checklist

Complete pre-deployment checklist for production deployment on Ubuntu VPS.

## Pre-Deployment Checks

### Infrastructure Requirements

- [ ] **VPS Access**: SSH access confirmed with root/sudo privileges
- [ ] **VPS Specifications**: Meets minimum requirements (4GB RAM, 2 CPU cores, 40GB storage)
- [ ] **Operating System**: Ubuntu 20.04 LTS or 22.04 LTS installed
- [ ] **Domain Name**: Domain registered and DNS configured
- [ ] **DNS Configuration**: Domain points to VPS IP address (verify with `dig your-domain.com`)
- [ ] **Existing Nginx**: Nginx already installed and running (if applicable)
- [ ] **Port Availability**: Ports 8080 and 8443 available for WebSCADA

### Required Software

- [ ] **Docker**: Version 20.10+ installed
- [ ] **Docker Compose**: Version 2.0+ installed
- [ ] **Git**: Installed for repository cloning
- [ ] **Nginx**: Installed and running
- [ ] **Certbot**: Available for SSL certificate generation (optional but recommended)

## Initial Setup

### Repository Setup

- [ ] **Clone Repository**: Repository cloned to `/opt/webscada` or appropriate location
- [ ] **Deployment Script**: `deploy-vps.sh` made executable (`chmod +x`)
- [ ] **Setup Script Run**: Executed `sudo ./deploy-vps.sh setup` successfully
- [ ] **Docker Verification**: Docker and Docker Compose working (`docker ps`, `docker-compose version`)

### Environment Configuration

- [ ] **Environment File Created**: Copied `.env.production.example` to `.env.production`
- [ ] **Domain Configured**: `DOMAIN` set to your actual domain
- [ ] **PostgreSQL Password**: Strong password generated and set (`openssl rand -base64 24`)
- [ ] **Redis Password**: Strong password generated and set (`openssl rand -base64 24`)
- [ ] **JWT Secret**: Secure secret generated and set (`openssl rand -base64 32`)
- [ ] **CORS Origin**: Set to your domain URL (e.g., `https://webscada.yourdomain.com`)
- [ ] **API URLs**: `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` configured correctly
- [ ] **MQTT Configuration**: MQTT broker settings configured (if using external broker)
- [ ] **All Secrets Verified**: All passwords and secrets are strong and unique

## Nginx Configuration

### Nginx Setup

- [ ] **Configuration Copied**: `webscada.conf` copied to `/etc/nginx/sites-available/`
- [ ] **Server Name Updated**: Replaced `webscada.yourdomain.com` with actual domain
- [ ] **SSL Paths Updated**: Certificate paths configured (if using SSL)
- [ ] **Symlink Created**: Configuration linked to `/etc/nginx/sites-enabled/`
- [ ] **Configuration Test**: `sudo nginx -t` passes without errors
- [ ] **Nginx Reloaded**: `sudo systemctl reload nginx` successful

### SSL Certificate (Recommended)

- [ ] **Certbot Installed**: `certbot` and `python3-certbot-nginx` installed
- [ ] **Certificate Generated**: SSL certificate obtained (`sudo certbot --nginx -d your-domain.com`)
- [ ] **Certificate Verification**: Certificate files exist and are valid
- [ ] **Auto-Renewal Enabled**: Certbot timer enabled (`sudo systemctl status certbot.timer`)
- [ ] **HTTPS Working**: Can access via HTTPS without browser warnings

## Security Configuration

### Firewall Setup

- [ ] **UFW Enabled**: Firewall enabled (`sudo ufw enable`)
- [ ] **SSH Allowed**: Port 22/tcp allowed
- [ ] **HTTP Allowed**: Port 80/tcp allowed (for existing sites)
- [ ] **HTTPS Allowed**: Port 443/tcp allowed (for existing sites)
- [ ] **WebSCADA HTTP**: Port 8080/tcp allowed
- [ ] **WebSCADA HTTPS**: Port 8443/tcp allowed
- [ ] **Default Policies**: Deny incoming, allow outgoing
- [ ] **Firewall Verified**: `sudo ufw status` shows correct rules

### SSH Security

- [ ] **SSH Keys Setup**: SSH key authentication configured
- [ ] **Root Login Disabled**: `PermitRootLogin no` in `/etc/ssh/sshd_config`
- [ ] **Password Auth Disabled**: `PasswordAuthentication no` (if using keys only)
- [ ] **SSH Restarted**: `sudo systemctl restart sshd` after changes

### Additional Security

- [ ] **Fail2Ban Installed**: Installed and configured for Nginx
- [ ] **System Updates**: All system packages updated (`sudo apt-get update && sudo apt-get upgrade`)
- [ ] **Docker Security**: Docker daemon configured with security best practices

## Application Deployment

### Build and Deploy

- [ ] **Environment Verified**: `.env.production` contains all required values
- [ ] **Deployment Executed**: `sudo ./deploy-vps.sh deploy` completed successfully
- [ ] **Images Built**: All Docker images built without errors
- [ ] **Containers Started**: All containers running (`docker ps`)
- [ ] **Health Checks**: All containers report healthy status

### Container Verification

- [ ] **PostgreSQL Running**: `webscada-postgres` container healthy
- [ ] **Redis Running**: `webscada-redis` container healthy
- [ ] **Mosquitto Running**: `webscada-mosquitto` container healthy
- [ ] **Backend Running**: `webscada-backend` container healthy
- [ ] **Frontend Running**: `webscada-frontend` container healthy
- [ ] **Realtime Running**: `webscada-realtime` container healthy

### Service Health Checks

- [ ] **Frontend Health**: `curl http://localhost:3000/` returns 200
- [ ] **Backend Health**: `curl http://localhost:3001/health` returns healthy response
- [ ] **Realtime Health**: `curl http://localhost:3002/health` returns healthy response
- [ ] **Database Connection**: Can connect to PostgreSQL via Docker exec
- [ ] **Redis Connection**: Can connect to Redis via Docker exec

## External Access Verification

### Domain Access

- [ ] **HTTP Access**: Can access `http://your-domain.com:8080`
- [ ] **HTTPS Access**: Can access `https://your-domain.com:8443`
- [ ] **Frontend Loads**: Web interface loads correctly
- [ ] **API Accessible**: Can reach `/api/health` endpoint
- [ ] **WebSocket Works**: Real-time connections establish successfully
- [ ] **No CORS Errors**: Browser console shows no CORS-related errors

### DNS Verification

- [ ] **DNS Resolves**: `dig your-domain.com` returns correct IP
- [ ] **A Record**: Domain A record points to VPS IP
- [ ] **Propagation Complete**: DNS changes propagated globally

## Monitoring & Logging

### Logging Setup

- [ ] **Log Directories**: Log directories created in `/var/log/webscada/`
- [ ] **Log Rotation**: Logrotate configured for WebSCADA logs
- [ ] **Nginx Logs**: Nginx access and error logs working
- [ ] **Container Logs**: All container logs accessible via `docker logs`

### Monitoring

- [ ] **Resource Usage**: Checked with `docker stats` - all within limits
- [ ] **System Resources**: Sufficient CPU, memory, and disk space available
- [ ] **Port Listeners**: Verified with `ss -tlnp` that all services listening correctly

## Backup Configuration

### Backup Setup

- [ ] **Backup Directory**: `/var/backups/webscada/` directory exists
- [ ] **Manual Backup Test**: `sudo ./deploy-vps.sh backup` works correctly
- [ ] **Backup Verification**: Backup files created and accessible
- [ ] **Automated Backups**: Cron job configured for daily backups at 2 AM
- [ ] **Backup Logs**: Backup logging configured to `/var/log/webscada/backup.log`
- [ ] **Restore Test**: Verified restore process works (in test environment if possible)

## Documentation

### Documentation Review

- [ ] **Deployment Guide**: Read [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- [ ] **README**: Reviewed [`README.md`](./README.md)
- [ ] **Architecture Docs**: Familiarized with system architecture
- [ ] **API Documentation**: Reviewed API endpoints and authentication
- [ ] **Troubleshooting**: Familiar with common issues and solutions

## Post-Deployment

### Final Verification

- [ ] **All Services Running**: `sudo ./deploy-vps.sh status` shows all services healthy
- [ ] **Logs Clean**: No critical errors in any service logs
- [ ] **Performance**: Response times acceptable for all endpoints
- [ ] **Real-time Working**: WebSocket connections stable
- [ ] **Database Accessible**: Can query database successfully
- [ ] **Redis Working**: Cache operations functional

### Testing

- [ ] **User Registration**: Can create new user accounts
- [ ] **User Login**: Authentication working correctly
- [ ] **Device Management**: Can add and manage devices
- [ ] **Data Ingestion**: Device data being received and stored
- [ ] **Alarms**: Alarm system functioning correctly
- [ ] **Dashboard**: Dashboard displays data correctly
- [ ] **API Endpoints**: All critical API endpoints responding

### Production Readiness

- [ ] **SSL Certificate Valid**: HTTPS working with valid certificate
- [ ] **Security Headers**: Security headers configured in Nginx
- [ ] **Rate Limiting**: Rate limiting active and tested
- [ ] **Error Handling**: Application handles errors gracefully
- [ ] **Monitoring Setup**: Basic monitoring in place

## Ongoing Maintenance

### Regular Tasks

- [ ] **Daily Backups**: Automated backups running daily
- [ ] **Weekly Log Review**: Log review process established
- [ ] **Monthly Updates**: System and Docker image update schedule
- [ ] **Certificate Renewal**: SSL certificate auto-renewal verified
- [ ] **Backup Retention**: Backup retention policy established
- [ ] **Disaster Recovery**: Recovery procedure documented

### Contact Information

- [ ] **Technical Contact**: Primary technical contact identified
- [ ] **Escalation Path**: Issue escalation process defined
- [ ] **Documentation Location**: All documentation locations known
- [ ] **Support Resources**: Support channels identified

## Sign-Off

### Deployment Team

- [ ] **System Administrator**: Deployment verified and signed off
- [ ] **Application Owner**: Application tested and approved
- [ ] **Security Officer**: Security checklist completed (if applicable)
- [ ] **Operations Team**: Monitoring and backup procedures in place

### Deployment Details

- **Deployment Date**: _______________
- **Deployed By**: _______________
- **Domain**: _______________
- **VPS Provider**: _______________
- **VPS IP**: _______________
- **Notes**: _________________________________

---

## Emergency Contacts

| Role               | Name | Contact          |
| ------------------ | ---- | ---------------- |
| System Admin       |      |                  |
| Application Owner  |      |                  |
| VPS Provider       |      |                  |
| Domain Registrar   |      |                  |

---

## Rollback Plan

In case of deployment failure:

1. **Stop Services**: `sudo ./deploy-vps.sh stop`
2. **Review Logs**: Check all container and Nginx logs
3. **Identify Issue**: Determine root cause
4. **Fix or Revert**: Fix configuration or revert to previous version
5. **Restore Backup**: Use `sudo ./deploy-vps.sh restore` if needed
6. **Restart Services**: `sudo ./deploy-vps.sh start`
7. **Verify**: Confirm all services operational

---

**Deployment Status**: [ ] Not Started  [ ] In Progress  [ ] Completed  [ ] Verified

**Production Ready**: [ ] Yes  [ ] No (Reason: __________________)

---

*Last Updated*: [Date]
*Deployment Version*: 1.0.0
