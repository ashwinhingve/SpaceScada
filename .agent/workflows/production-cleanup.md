---
description: Production cleanup and optimization workflow
---

# WebSCADA Production Cleanup & Optimization

This workflow cleans and organizes the entire WebSCADA project for production deployment on Hostinger VPS (2 CPU cores, 8GB RAM, 100GB storage) with existing NGINX and PM2 setup.

## Phase 1: Remove Unused/Unwanted Files

### 1.1 Remove Development-Only Files
- [ ] Delete `.claude/` folder (AI assistant settings - not needed in production)
- [ ] Delete `build-output.log` (temporary build log)
- [ ] Delete `apps/frontend/src/app/console/dashboard/page.tsx.backup` (backup file)
- [ ] Delete empty `logs/` subdirectories (will be recreated on deployment)
- [ ] Delete empty `infrastructure/influxdb/` directory (not being used)

### 1.2 Clean Documentation Folder
- [ ] Keep essential deployment docs:
  - `DEPLOYMENT.md`
  - `PRODUCTION-DEPLOYMENT-GUIDE.md`
  - `UBUNTU-VPS-DEPLOYMENT.md`
  - `DEPLOYMENT-CHECKLIST.md`
  - `README.md`
  - `QUICK-REFERENCE.md`
- [ ] Remove redundant docs:
  - `DEPLOYMENT-FIXES-SUMMARY.md` (merge into main deployment doc)
  - `WARP.md` (development-specific)
- [ ] Organize architecture and API docs (keep as-is, they're well structured)

### 1.3 Remove Unused Infrastructure
- [ ] Remove ChirpStack infrastructure (if not using LoRaWAN):
  - `infrastructure/chirpstack/` directory
- [ ] Remove InfluxDB infrastructure (empty and unused):
  - `infrastructure/influxdb/` directory
- [ ] Keep monitoring infrastructure for future use

## Phase 2: Optimize for VPS Constraints

### 2.1 Update Docker Compose Resource Limits
Optimize for 8GB RAM, 2 CPU cores:
- [ ] PostgreSQL: 512MB-1GB (currently 512MB-1GB) ✓
- [ ] Redis: 256MB-512MB (currently 512MB) - reduce to 256MB-384MB
- [ ] Backend: 512MB-768MB (currently 512MB-1GB) - reduce max to 768MB
- [ ] Frontend: 384MB-512MB (currently 512MB-1GB) - reduce to 384MB-512MB
- [ ] Realtime: 256MB-384MB (currently 512MB) - reduce to 256MB-384MB
- [ ] Mosquitto: 128MB-256MB (currently 256MB) - keep as-is

Total: ~2.5GB max for all containers (leaving 5.5GB for OS and other sites)

### 2.2 Optimize Build Process
- [ ] Add `.dockerignore` optimizations
- [ ] Enable multi-stage builds for smaller images
- [ ] Add build caching strategies

### 2.3 Configure for Multi-Site VPS
- [ ] Verify all ports bind to 127.0.0.1 only (no conflicts with other sites)
- [ ] Update NGINX config to use domain-based routing
- [ ] Ensure no port 80/443 conflicts (using reverse proxy only)

## Phase 3: Production Hardening

### 3.1 Security Enhancements
- [ ] Add rate limiting to NGINX config
- [ ] Configure proper CORS origins
- [ ] Add security headers
- [ ] Enable fail2ban integration
- [ ] Add health check endpoints

### 3.2 Logging & Monitoring
- [ ] Configure log rotation
- [ ] Set up centralized logging
- [ ] Add resource monitoring alerts
- [ ] Configure backup automation

### 3.3 Performance Optimization
- [ ] Enable NGINX caching for static assets
- [ ] Configure Redis cache policies
- [ ] Optimize database queries
- [ ] Enable compression (gzip/brotli)

## Phase 4: Testing & Validation

### 4.1 Pre-Deployment Tests
- [ ] Run `check-vps-compatibility.sh` on VPS
- [ ] Test build process locally
- [ ] Verify environment variables
- [ ] Check SSL certificates

### 4.2 Deployment Validation
- [ ] Deploy to staging environment first
- [ ] Test all endpoints
- [ ] Verify WebSocket connections
- [ ] Check database migrations
- [ ] Monitor resource usage

### 4.3 Post-Deployment Verification
- [ ] Verify existing sites still work
- [ ] Test WebSCADA functionality
- [ ] Check logs for errors
- [ ] Monitor resource consumption
- [ ] Set up automated backups

## Phase 5: Documentation Updates

### 5.1 Update Deployment Docs
- [ ] Consolidate deployment guides
- [ ] Add multi-site VPS specific instructions
- [ ] Update resource requirements
- [ ] Add troubleshooting section

### 5.2 Create Operations Manual
- [ ] Backup and restore procedures
- [ ] Scaling guidelines
- [ ] Monitoring and alerting
- [ ] Incident response

## Cleanup Commands

```bash
# Remove development files
rm -rf .claude/
rm -f build-output.log
rm -f apps/frontend/src/app/console/dashboard/page.tsx.backup

# Remove empty/unused infrastructure
rm -rf infrastructure/influxdb/
rm -rf infrastructure/chirpstack/  # Only if not using LoRaWAN

# Clean logs
find logs/ -type d -empty -delete

# Remove redundant docs
rm -f documents/DEPLOYMENT-FIXES-SUMMARY.md
rm -f documents/WARP.md
```

## Resource Allocation Summary

**Total VPS Resources:**
- CPU: 2 cores
- RAM: 8 GB
- Storage: 100 GB

**WebSCADA Allocation:**
- CPU: ~1.5 cores max (leaving 0.5 for OS and other sites)
- RAM: ~2.5 GB max (leaving 5.5 GB for OS and other sites)
- Storage: ~20 GB (app + data + logs)

**Remaining for Other Sites:**
- CPU: 0.5 cores
- RAM: 5.5 GB
- Storage: 80 GB

## Final Checklist

- [ ] All unused files removed
- [ ] Resource limits optimized
- [ ] Security hardened
- [ ] Logging configured
- [ ] Backups automated
- [ ] Documentation updated
- [ ] Deployment tested
- [ ] Monitoring active
- [ ] No port conflicts
- [ ] Existing sites unaffected
