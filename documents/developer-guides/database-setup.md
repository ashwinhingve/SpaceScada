# Database Setup Guide

## Summary

**Good News!** Your backend is already configured to use a **real PostgreSQL database** instead of dummy data. The database schema exists and the ESP32Service is fully integrated with the database.

## Database Schema

The following tables are automatically created when the database starts:

### ESP32 Tables
- `esp32_devices` - Stores device information (id, name, type, status, config, etc.)
- `esp32_sensor_data` - Historical sensor data (temperature, humidity, pressure, etc.)
- `esp32_control_history` - Control command history

### Other Tables
- `devices` - Base devices table for all device types
- `tags` - Device tags/data points
- `alarms` - Alarm records
- `gsm_messages`, `gsm_locations`, `gsm_network_logs` - GSM device data
- `users` - User authentication (includes default admin user)

## Setup Instructions

### Option 1: Using Docker Compose (Recommended)

1. **Start the database services:**
   ```bash
   docker compose up -d postgres redis
   ```

2. **Verify the database is running:**
   ```bash
   docker compose ps
   ```

3. **Check the database logs:**
   ```bash
   docker compose logs postgres
   ```

4. **The database will automatically initialize** with the schema from `infrastructure/docker/init-db.sql`

### Option 2: Manual PostgreSQL Installation

If you prefer to run PostgreSQL manually:

1. **Install PostgreSQL 16** on your system

2. **Create the database:**
   ```bash
   psql -U postgres
   CREATE DATABASE webscada;
   CREATE USER webscada WITH PASSWORD 'webscada_password';
   GRANT ALL PRIVILEGES ON DATABASE webscada TO webscada;
   \q
   ```

3. **Initialize the schema:**
   ```bash
   psql -U webscada -d webscada -f infrastructure/docker/init-db.sql
   ```

4. **Install and start Redis:**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis

   # On macOS with Homebrew
   brew install redis
   brew services start redis
   ```

## Environment Configuration

The `.env` file has been created at `apps/backend/.env` with the following configuration:

```env
DATABASE_URL=postgresql://webscada:webscada_password@localhost:5432/webscada
REDIS_URL=redis://localhost:6379
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

**Note:** These credentials match the docker-compose.yml configuration.

## Starting the Backend

Once the database is running:

```bash
# From the project root
pnpm dev

# Or start only the backend
pnpm dev --filter=backend
```

## Verifying the Setup

1. **Check backend health:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **List ESP32 devices:**
   ```bash
   curl http://localhost:3001/api/esp32/devices
   ```

3. **Register a test device:**
   ```bash
   curl -X POST http://localhost:3001/api/esp32/devices \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test ESP32",
       "sensorType": "DHT22",
       "mqttBroker": "localhost",
       "mqttPort": 1883
     }'
   ```

## Database Credentials

### Development (Docker Compose)
- **Host:** localhost
- **Port:** 5432
- **Database:** webscada
- **User:** webscada
- **Password:** webscada_password

### Default Admin User
- **Username:** admin
- **Email:** admin@webscada.local
- **Password:** admin123 (⚠️ Change in production!)

## Troubleshooting

### Database Connection Failed

1. **Check if PostgreSQL is running:**
   ```bash
   docker compose ps postgres
   # or for manual installation
   sudo systemctl status postgresql
   ```

2. **Check the logs:**
   ```bash
   docker compose logs postgres
   ```

3. **Verify the connection string** in `apps/backend/.env` matches your setup

### Redis Connection Failed

1. **Check if Redis is running:**
   ```bash
   docker compose ps redis
   # or for manual installation
   redis-cli ping
   ```

### Tables Not Created

If tables are missing, manually run the initialization script:

```bash
docker compose exec postgres psql -U webscada -d webscada -f /docker-entrypoint-initdb.d/init.sql
```

## What Changed

### Files Created/Modified
- ✅ `apps/backend/.env` - Created with correct database credentials
- ℹ️ Backend already uses database (no code changes needed!)
- ℹ️ Frontend already uses real API calls (no code changes needed!)

### No Dummy Data
- ❌ No dummy/mock data in backend
- ❌ No dummy/mock data in frontend
- ✅ All data comes from PostgreSQL database
- ✅ Real-time updates via WebSocket and MQTT

## Architecture

```
┌─────────────┐     HTTP/WS      ┌─────────────┐
│   Frontend  │ ◄──────────────► │   Backend   │
│  (Next.js)  │                  │  (Fastify)  │
└─────────────┘                  └──────┬──────┘
                                        │
                     ┌──────────────────┼──────────────────┐
                     │                  │                  │
                     ▼                  ▼                  ▼
              ┌─────────────┐    ┌──────────┐      ┌──────────┐
              │ PostgreSQL  │    │  Redis   │      │   MQTT   │
              │  (Device    │    │ (Cache)  │      │ (Devices)│
              │   Data)     │    │          │      │          │
              └─────────────┘    └──────────┘      └──────────┘
```

## Next Steps

1. **Start the database** (see Option 1 or 2 above)
2. **Start the backend:** `pnpm dev --filter=backend`
3. **Start the frontend:** `pnpm dev --filter=frontend`
4. **Register ESP32 devices** via the UI or API
5. **Connect real ESP32 devices** to the MQTT broker

## Additional Resources

- Database schema: `infrastructure/docker/init-db.sql`
- Production schema: `infrastructure/database/migrations/001_initial_schema.sql`
- Docker Compose: `docker-compose.yml`
- Backend service: `apps/backend/src/services/esp32.service.ts`
