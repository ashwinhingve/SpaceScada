# Device Dashboards - Deployment Guide

## 🚀 Quick Deployment (5 Steps - 10 Minutes)

### Step 1: Run Database Migrations (2 min)

```bash
cd apps/backend

# Run telemetry migration
psql -U webscada -d webscada -f migrations/008_device_telemetry_schema.sql

# Run logs migration
psql -U webscada -d webscada -f migrations/009_device_logs_schema.sql

# Verify migrations
psql -U webscada -d webscada -c "\dt device_*"
```

**Expected Output:**
```
 device_telemetry
 device_logs
 device_configurations
```

### Step 2: Initialize Services in Backend (3 min)

**File:** `apps/backend/src/server.ts`

Add these imports at the top:
```typescript
import { TelemetryService } from './services/telemetry.service';
import { LogsService } from './services/logs.service';
import { WiFiService } from './services/wifi.service';
import { BluetoothService } from './services/bluetooth.service';
```

Find where other services are initialized (look for `DatabaseService`) and add:
```typescript
// Initialize telemetry and logs services
const telemetryService = new TelemetryService(database);
const logsService = new LogsService(database);

// Initialize device services (if not already done)
const wifiService = new WiFiService(database);
const bluetoothService = new BluetoothService(database);

// Decorate fastify instance with services
fastify.decorate('telemetryService', telemetryService);
fastify.decorate('logsService', logsService);
fastify.decorate('wifiService', wifiService);
fastify.decorate('bluetoothService', bluetoothService);
```

### Step 3: Register Routes (1 min)

Find where routes are registered and ensure these are included:
```typescript
import { wifiRoutes } from './routes/wifi';
import { bluetoothRoutes } from './routes/bluetooth';
import { gsmRoutes } from './routes/gsm';
import { lorawanRoutes } from './routes/lorawan';

// Register device routes
await fastify.register(wifiRoutes, { prefix: '/api/wifi' });
await fastify.register(bluetoothRoutes, { prefix: '/api/bluetooth' });
await fastify.register(gsmRoutes, { prefix: '/api/gsm' });
await fastify.register(lorawanRoutes, { prefix: '/api/lorawan' });
```

### Step 4: Start Services (2 min)

```bash
# Terminal 1: Start backend
cd apps/backend
pnpm dev

# Terminal 2: Start frontend
cd apps/frontend
pnpm dev
```

**Verify Backend:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok"}
```

### Step 5: Test a Dashboard (2 min)

1. Create a test Wi-Fi device:
```bash
curl -X POST http://localhost:3001/api/wifi \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test WiFi Device",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "application_id": "test-app-1",
    "ssid": "TestNetwork",
    "signal_strength": 75,
    "status": "online",
    "chipset": "ESP32"
  }'
```

2. Get the device ID from response and visit:
```
http://localhost:3000/console/wifi-devices/[device-id]
```

3. You should see:
   - ✅ Device information
   - ✅ Metric cards
   - ✅ Empty telemetry charts (no data yet)
   - ✅ Empty logs viewer
   - ✅ Configuration panel

## 📊 Testing Telemetry & Logs

### Add Sample Telemetry Data

```bash
# Get your device ID from previous step
DEVICE_ID="your-device-id-here"

# Add telemetry data point
curl -X POST http://localhost:3001/api/wifi/$DEVICE_ID/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "metric_name": "signal_strength",
    "metric_value": 78,
    "metric_unit": "%",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Add more data points with different timestamps
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/wifi/$DEVICE_ID/telemetry \
    -H "Content-Type: application/json" \
    -d '{
      "metric_name": "signal_strength",
      "metric_value": '$((70 + RANDOM % 20))',
      "metric_unit": "%"
    }'
  sleep 1
done
```

### Add Sample Logs

```bash
# Add log entries
curl -X POST http://localhost:3001/api/wifi/$DEVICE_ID/logs \
  -H "Content-Type: application/json" \
  -d '{
    "log_level": "info",
    "event_type": "connection",
    "message": "Device connected to network",
    "details": {"ssid": "TestNetwork", "ip": "192.168.1.100"}
  }'

curl -X POST http://localhost:3001/api/wifi/$DEVICE_ID/logs \
  -H "Content-Type: application/json" \
  -d '{
    "log_level": "warning",
    "event_type": "signal_degradation",
    "message": "Signal strength dropped below threshold",
    "details": {"current_strength": 45, "threshold": 50}
  }'

curl -X POST http://localhost:3001/api/wifi/$DEVICE_ID/logs \
  -H "Content-Type: application/json" \
  -d '{
    "log_level": "error",
    "event_type": "connection_lost",
    "message": "Lost connection to network",
    "details": {"duration": 120, "reason": "timeout"}
  }'
```

### Refresh Dashboard

1. Refresh the dashboard page (or wait for auto-refresh)
2. You should now see:
   - ✅ Telemetry chart with data points
   - ✅ Log entries with color-coded severity
   - ✅ Searchable/filterable logs

## 🔧 Complete Backend Integration

### Option A: Quick Copy-Paste for Bluetooth Routes

Add to `apps/backend/src/routes/bluetooth.ts`:

```typescript
// After existing imports, add:
import { TelemetryService } from '../services/telemetry.service';
import { LogsService } from '../services/logs.service';

// In bluetoothRoutes function, after bluetoothService, add:
const telemetryService: TelemetryService = (fastify as any).telemetryService;
const logsService: LogsService = (fastify as any).logsService;

if (!telemetryService) {
  throw new Error('TelemetryService not initialized');
}
if (!logsService) {
  throw new Error('LogsService not initialized');
}

// Then copy all telemetry, logs, and configuration endpoints from wifi.ts
// Replace 'wifi' with 'bluetooth' in all endpoint paths and device_type parameters
```

### Option B: Extend GSM & LoRaWAN Routes

**For GSM (`apps/backend/src/routes/gsm.ts`):**
- GSM already has custom endpoints (SMS, GPS, network)
- Add telemetry/logs endpoints AFTER existing routes
- Use device_type: 'gsm' in service calls

**For LoRaWAN (`apps/backend/src/routes/lorawan.ts`):**
- LoRaWAN has ChirpStack metrics
- Add telemetry endpoints to store metrics locally
- Add logs for device events
- Use device_type: 'lorawan' in service calls

## 🧪 Testing All Device Types

### Wi-Fi Device Test
```bash
# Create device
curl -X POST http://localhost:3001/api/wifi \
  -H "Content-Type: application/json" \
  -d '{"name":"ESP32-01","mac_address":"AA:BB:CC:DD:EE:01","application_id":"app1","ssid":"HomeNet","signal_strength":85,"chipset":"ESP32"}'

# Visit: http://localhost:3000/console/wifi-devices/[id]
```

### Bluetooth Device Test
```bash
# Create device
curl -X POST http://localhost:3001/api/bluetooth \
  -H "Content-Type: application/json" \
  -d '{"name":"BLE-Sensor-01","mac_address":"AA:BB:CC:DD:EE:02","application_id":"app1","protocol":"BLE","signal_strength":90,"battery_level":85}'

# Visit: http://localhost:3000/console/bluetooth-devices/[id]
```

### GSM Device Test
```bash
# Register device (check GSM API for exact endpoint)
curl -X POST http://localhost:3001/api/gsm \
  -H "Content-Type: application/json" \
  -d '{"name":"SIM800-01","imei":"123456789012345","applicationId":"app1","networkType":"4G","signalStrength":78}'

# Visit: http://localhost:3000/console/gsm-devices/[id]
```

### LoRaWAN Device Test
```bash
# Create application first
curl -X POST http://localhost:3001/api/lorawan/applications \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Application","description":"Test app for devices"}'

# Create device
curl -X POST http://localhost:3001/api/lorawan/devices \
  -H "Content-Type: application/json" \
  -d '{"devEui":"0000000000000001","name":"LoRa-Sensor-01","applicationId":"[app-id]","deviceProfileId":"[profile-id]","activationMode":"OTAA"}'

# Visit: http://localhost:3000/console/end-devices/[devEui]
```

## 🎯 Feature Checklist

Test each dashboard has:

### ✅ Wi-Fi Dashboard
- [ ] Device header with name, MAC, status
- [ ] 4 metric cards (signal, status, IP, uptime)
- [ ] Signal strength chart (24h)
- [ ] Logs viewer with filtering
- [ ] Configuration panel
- [ ] Device info tab
- [ ] Auto-refresh works (10s)
- [ ] Manual refresh button

### ✅ Bluetooth Dashboard
- [ ] Device header with name, MAC, protocol
- [ ] 4 metric cards (signal, battery, status, firmware)
- [ ] Dual charts (signal + battery 24h)
- [ ] Logs viewer with filtering
- [ ] Configuration with manufacturer
- [ ] Device info tab
- [ ] Auto-refresh works (10s)

### ✅ GSM Dashboard
- [ ] Device header with IMEI, network type
- [ ] 4 metric cards (signal, battery, network, GPS)
- [ ] Dual charts (signal + battery 24h)
- [ ] GPS tracking tab with location history
- [ ] Network information tab
- [ ] Logs viewer
- [ ] SMS button (UI only for now)
- [ ] Auto-refresh works (10s)

### ✅ LoRaWAN Dashboard
- [ ] Device header with DevEUI, class, activation
- [ ] 4 metric cards (status, uplink, downlink, gateways)
- [ ] Dual charts (RSSI + SNR 24h)
- [ ] Frame information tab
- [ ] Logs viewer
- [ ] Configuration with device profile
- [ ] Device info tab
- [ ] Auto-refresh works (15s)
- [ ] Downlink button (UI only for now)

## 🐛 Troubleshooting

### Issue: Services not initialized error
**Solution:** Verify services are decorated in `server.ts`:
```bash
grep -n "telemetryService" apps/backend/src/server.ts
grep -n "logsService" apps/backend/src/server.ts
```

### Issue: Migration fails
**Solution:** Check if tables already exist:
```bash
psql -U webscada -d webscada -c "\dt device_*"
```
If they exist, drop and re-run:
```bash
psql -U webscada -d webscada -c "DROP TABLE IF EXISTS device_telemetry CASCADE;"
psql -U webscada -d webscada -c "DROP TABLE IF EXISTS device_logs CASCADE;"
```

### Issue: Dashboard shows "Device not found"
**Solution:**
1. Check device exists: `curl http://localhost:3001/api/wifi/[id]`
2. Check device ID in URL matches database
3. Check backend logs for errors

### Issue: Charts show "No data available"
**Solution:**
1. Verify telemetry endpoint works:
   ```bash
   curl http://localhost:3001/api/wifi/[id]/telemetry
   ```
2. Add test data using POST telemetry endpoint
3. Check time range (only shows last 24h)

### Issue: Logs not appearing
**Solution:**
1. Check logs API:
   ```bash
   curl http://localhost:3001/api/wifi/[id]/logs
   ```
2. Add test logs using POST logs endpoint
3. Try refresh button

## 📈 Performance Tips

### Database Indexing
The migrations already include indexes, but verify:
```sql
-- Check indexes
SELECT tablename, indexname FROM pg_indexes
WHERE tablename IN ('device_telemetry', 'device_logs');
```

### Data Retention
Set up automatic cleanup (run weekly):
```sql
-- Clean up old telemetry (keeps 90 days)
SELECT cleanup_old_telemetry(90);

-- Clean up old logs (keeps 30 days)
SELECT cleanup_old_logs(30);
```

### Refresh Intervals
Current refresh intervals:
- Wi-Fi, Bluetooth, GSM: 10 seconds
- LoRaWAN: 15 seconds (less frequent updates)

Adjust in dashboard files if needed:
```typescript
// Change 10000 to desired milliseconds
const interval = setInterval(fetchDeviceData, 10000);
```

## 🎉 Success Criteria

You're done when:
- ✅ All 4 dashboards load without errors
- ✅ Can create devices via API
- ✅ Telemetry charts show data
- ✅ Logs viewer displays entries
- ✅ Auto-refresh updates data
- ✅ No console errors in browser
- ✅ Backend serves all endpoints

## 🚀 Next Steps

After basic deployment:
1. **WebSocket Integration** - Replace polling with real-time updates
2. **Authentication** - Add user authentication to dashboards
3. **Data Export** - Add CSV/JSON export for telemetry
4. **Alerts** - Add alerting based on telemetry thresholds
5. **Mobile App** - Responsive design already works on mobile
6. **API Documentation** - Document all endpoints with Swagger

## 📞 Support

If you encounter issues:
1. Check `DASHBOARD-IMPLEMENTATION-SUMMARY.md` for architecture
2. Review console errors in browser DevTools
3. Check backend logs: `pnpm dev` output
4. Verify database connection
5. Ensure all migrations ran successfully

---

**Ready to Deploy!** Follow Step 1-5 above to get started. Total time: ~10 minutes.
