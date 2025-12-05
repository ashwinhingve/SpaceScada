# WebSCADA

Modern, cloud-native industrial monitoring and control system (SCADA) built as a web application.

## Overview

WebSCADA is a full-stack industrial IoT platform providing real-time monitoring of industrial devices, data visualization, alarm management, and control capabilities. Built with TypeScript, Next.js, and Fastify, it supports multiple industrial protocols including ESP32, LoRaWAN, MQTT, and integrates with InfluxDB for time-series data.

## Features

- **Real-time Monitoring**: Live device data updates via WebSocket
- **Multi-Protocol Support**: ESP32, LoRaWAN/ChirpStack, MQTT
- **Time-Series Data**: InfluxDB integration for historical data
- **Device Management**: Comprehensive device and tag management
- **Alarm System**: Configurable alarms and notifications
- **Responsive UI**: Modern web interface built with Next.js and Tailwind CSS
- **RESTful API**: Complete API for device control and data access
- **Production Ready**: Docker Compose deployment with Nginx reverse proxy

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Recharts
- **Real-time**: Socket.io Client

### Backend
- **Framework**: Fastify 4.x
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **WebSocket**: Socket.io
- **Protocols**: MQTT (via Mosquitto)

### Infrastructure
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Time-Series**: InfluxDB
- **LoRaWAN**: ChirpStack

## Quick Start

### Prerequisites

- Ubuntu 20.04 LTS or 22.04 LTS
- Docker 20.10+
- Docker Compose 2.0+
- Nginx (for production)
- Domain name (for production)

### Production Deployment

1. **Clone the repository**

```bash
cd /opt
git clone <repository-url> webscada
cd webscada
```

2. **Run setup**

```bash
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh setup
```

3. **Configure environment**

```bash
cp .env.production.example .env.production
nano .env.production
```

Update:
- `DOMAIN` - your domain name
- `POSTGRES_PASSWORD` - generate with `openssl rand -base64 24`
- `REDIS_PASSWORD` - generate with `openssl rand -base64 24`
- `JWT_SECRET` - generate with `openssl rand -base64 32`
- `CORS_ORIGIN` - your domain URL
- API URLs

4. **Configure Nginx**

```bash
sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/webscada.conf
sudo nano /etc/nginx/sites-available/webscada.conf
# Update server_name and SSL paths
sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5. **Setup SSL** (recommended)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

6. **Deploy**

```bash
sudo ./deploy-vps.sh deploy
```

7. **Verify**

```bash
sudo ./deploy-vps.sh status
```

Access at: `https://your-domain.com:8443`

## Project Structure

```
webscada/
├── apps/
│   ├── backend/              # Fastify API server
│   ├── frontend/             # Next.js web application
│   └── realtime-service/     # Real-time data service
├── packages/
│   ├── shared-types/         # TypeScript type definitions
│   ├── utils/                # Shared utilities
│   └── protocols/            # Protocol handlers
├── infrastructure/
│   ├── docker/               # Dockerfiles
│   ├── nginx/                # Nginx reverse proxy config
│   ├── database/             # Database init scripts
│   ├── mosquitto/            # MQTT broker config
│   ├── chirpstack/           # LoRaWAN server config
│   └── influxdb/             # InfluxDB config
├── firmware/
│   └── esp32/                # ESP32 device firmware
├── documents/
│   ├── architecture/         # System architecture docs
│   └── api/                  # API documentation
├── docker-compose.vps.yml    # Production Docker Compose
├── deploy-vps.sh             # Deployment automation script
├── .env.production.example   # Environment template
├── DEPLOYMENT.md             # Complete deployment guide
└── README.md                 # This file
```

## Architecture

### Services

- **Frontend** (Port 3000): Next.js web application
- **Backend** (Port 3001): Fastify REST API and WebSocket server
- **Realtime Service** (Port 3002): Real-time data streaming
- **PostgreSQL** (Port 5432): Primary database
- **Redis** (Port 6379): Caching and pub/sub
- **Mosquitto** (Port 1883): MQTT broker

### Network

All services run in a Docker internal network (172.25.0.0/16). External access is routed through Nginx reverse proxy on ports 8080 (HTTP) and 8443 (HTTPS), avoiding conflicts with existing websites on ports 80/443.

### Protocols

- **ESP32**: MQTT-based device communication
- **LoRaWAN**: ChirpStack integration for LoRaWAN devices
- **InfluxDB**: Time-series data storage and querying

## Management

### Deployment Commands

```bash
sudo ./deploy-vps.sh deploy      # Deploy/update
sudo ./deploy-vps.sh start       # Start services
sudo ./deploy-vps.sh stop        # Stop services
sudo ./deploy-vps.sh restart     # Restart services
sudo ./deploy-vps.sh status      # Show status
sudo ./deploy-vps.sh logs        # View logs
```

### Backup Commands

```bash
sudo ./deploy-vps.sh backup      # Create backup
sudo ./deploy-vps.sh restore     # Restore from backup
```

### Docker Commands

```bash
docker ps                        # List containers
docker logs webscada-backend     # View backend logs
docker exec -it webscada-backend bash  # Shell access
docker stats                     # Resource usage
```

## Configuration

### Environment Variables

See `.env.production.example` for all available configuration options.

**Critical settings:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Authentication secret
- `CORS_ORIGIN` - Frontend URL for CORS
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

### Nginx

Nginx configuration includes:
- Reverse proxy for all services
- Rate limiting (10 req/s for API, 30 req/s for WebSocket)
- Connection limits (50 concurrent per IP)
- SSL/TLS termination
- WebSocket proxy support
- Security headers

## Security

### Best Practices

1. **Strong passwords**: Use `openssl rand -base64 32` for all secrets
2. **SSL/TLS**: Always use HTTPS in production
3. **Firewall**: Enable UFW and allow only necessary ports
4. **SSH keys**: Disable password authentication
5. **Regular updates**: Keep system and Docker images updated
6. **Fail2Ban**: Install for brute-force protection
7. **Backups**: Schedule daily automated backups

### Firewall Setup

```bash
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 8080/tcp    # WebSCADA HTTP
sudo ufw allow 8443/tcp    # WebSCADA HTTPS
```

## Monitoring

### Health Checks

- Frontend: `http://localhost:3000/`
- Backend: `http://localhost:3001/health`
- Realtime: `http://localhost:3002/health`

### Logs

```bash
# Application logs
docker logs -f webscada-backend
docker logs -f webscada-frontend
docker logs -f webscada-realtime

# Nginx logs
sudo tail -f /var/log/nginx/webscada_access.log
sudo tail -f /var/log/nginx/webscada_error.log

# System logs
sudo tail -f /var/log/webscada/*.log
```

### Resource Usage

```bash
# Container stats
docker stats

# System resources
htop
df -h
free -h
```

## Backup & Recovery

### Automated Backups

Setup daily backups at 2 AM:

```bash
sudo crontab -e
# Add: 0 2 * * * /opt/webscada/deploy-vps.sh backup >> /var/log/webscada/backup.log 2>&1
```

### Manual Backup

```bash
# Database backup
docker exec webscada-postgres pg_dump -U webscada webscada > backup.sql

# Full system backup
sudo ./deploy-vps.sh backup
```

### Restore

```bash
# From automated backup
sudo ./deploy-vps.sh restore

# From manual backup
docker exec -i webscada-postgres psql -U webscada webscada < backup.sql
```

## Troubleshooting

### Common Issues

**Containers won't start**
```bash
docker logs webscada-backend
sudo ./deploy-vps.sh restart
```

**502 Bad Gateway**
```bash
docker logs webscada-backend
docker restart webscada-backend
sudo nginx -t
```

**Database connection error**
```bash
docker ps | grep postgres
docker logs webscada-postgres
docker exec webscada-postgres psql -U webscada -d webscada -c "SELECT 1;"
```

**Cannot access via domain**
```bash
dig your-domain.com              # Check DNS
sudo systemctl status nginx      # Check Nginx
sudo ufw status                  # Check firewall
docker ps                        # Check containers
```

## Documentation

- **Deployment Guide**: [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Complete deployment instructions
- **Deployment Checklist**: [`DEPLOYMENT-CHECKLIST.md`](./DEPLOYMENT-CHECKLIST.md) - Pre-deployment checklist
- **Architecture**: [`documents/architecture/`](./documents/architecture/) - System architecture
- **API Reference**: [`documents/api/`](./documents/api/) - API documentation

## Development

For local development:

```bash
# Install dependencies
pnpm install

# Start databases
docker-compose -f docker-compose.vps.yml up -d postgres redis mosquitto

# Start applications
pnpm dev
```

## License

Private

## Support

For issues and questions:

1. Check logs: `docker logs <container-name>`
2. Review [`DEPLOYMENT.md`](./DEPLOYMENT.md)
3. Check [`documents/architecture/`](./documents/architecture/)
4. Verify environment variables
5. Consult troubleshooting section

---

**Production deployment**: See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for complete instructions.
