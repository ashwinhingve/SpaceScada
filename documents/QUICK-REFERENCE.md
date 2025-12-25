# WebSCADA Production Deployment - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1️⃣ Setup VPS
```bash
cd /opt/webscada
sudo ./deploy-vps.sh setup
```

### 2️⃣ Get SSL Certificate
```bash
sudo certbot --nginx -d webscada.spaceautotech.com
```

### 3️⃣ Deploy Application
```bash
sudo systemctl reload nginx
sudo ./deploy-vps.sh deploy
```

---

## ✅ Pre-Deployment Checklist

- [ ] DNS points to VPS: `webscada.spaceautotech.com`
- [ ] `.env.production` configured with strong passwords
- [ ] SSL certificate obtained via certbot
- [ ] Existing websites verified working

---

## 🔧 Common Commands

```bash
# View logs
./deploy-vps.sh logs

# Check status
./deploy-vps.sh status

# Restart services
sudo ./deploy-vps.sh restart

# Backup data
sudo ./deploy-vps.sh backup

# Stop services
sudo ./deploy-vps.sh stop
```

---

## 🛡️ Safety Features

✅ **No Port Conflicts**: Uses standard ports 80/443 with server_name isolation  
✅ **Localhost Binding**: Docker containers only accessible via NGINX  
✅ **Pre-Deployment Checks**: Validates SSL, NGINX config, and dependencies  
✅ **No Auto-Reload**: NGINX never reloaded automatically  
✅ **Easy Rollback**: Simple commands to disable WebSCADA  

---

## 🚨 Emergency Rollback

```bash
# Disable WebSCADA immediately
sudo rm /etc/nginx/sites-enabled/webscada.conf
sudo systemctl reload nginx

# Stop containers
sudo ./deploy-vps.sh stop
```

---

## 🔍 Troubleshooting

### Check if services are running
```bash
docker ps | grep webscada
```

### Test health endpoints
```bash
curl http://127.0.0.1:3001/health
curl -I https://webscada.spaceautotech.com/
```

### View error logs
```bash
# Application logs
docker logs webscada-backend

# NGINX logs
sudo tail -f /var/log/nginx/webscada_error.log
```

### Verify NGINX config
```bash
sudo nginx -t
```

---

## 📚 Full Documentation

See [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md) for complete instructions.

---

## 🔐 Security Notes

- All Docker containers bind to `127.0.0.1` only
- NGINX handles SSL termination
- Rate limiting configured per domain
- Firewall should allow only ports 22, 80, 443
- Regular backups automated via cron

---

## 📞 Support Checklist

Before asking for help, check:
1. ✅ Docker containers running: `docker ps`
2. ✅ NGINX config valid: `sudo nginx -t`
3. ✅ SSL certificates exist: `ls -la /etc/letsencrypt/live/webscada.spaceautotech.com/`
4. ✅ Logs reviewed: `./deploy-vps.sh logs`
5. ✅ Existing sites working: `curl -I https://your-other-site.com`
