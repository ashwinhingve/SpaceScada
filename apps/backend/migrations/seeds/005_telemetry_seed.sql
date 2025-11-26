-- Seed Data: Device Telemetry
-- Description: Populates time-series telemetry data for all device types
-- Time Range: Last 24 hours with realistic sensor readings

-- ============================================
-- LORAWAN DEVICE TELEMETRY
-- ============================================

-- Parking Sensor - Lot A (Occupancy data)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  '11111111-2222-3333-4444-555555555551'::uuid,
  'lorawan',
  'occupancy',
  CASE WHEN RANDOM() > 0.6 THEN 1 ELSE 0 END, -- 40% occupied
  'boolean',
  '{"sensor_type": "ultrasonic", "space_id": "A-15"}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(5, 1440, 15) AS interval_offset; -- Every 15 minutes for 24 hours

-- Air Quality Sensor - Downtown (PM2.5, Temperature, Humidity)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  '11111111-2222-3333-4444-555555555552'::uuid,
  'lorawan',
  unnest(ARRAY['pm25', 'temperature', 'humidity']) AS metric_name,
  unnest(ARRAY[
    12 + RANDOM() * 18, -- PM2.5: 12-30 µg/m³
    18 + RANDOM() * 8, -- Temperature: 18-26°C
    45 + RANDOM() * 25 -- Humidity: 45-70%
  ]) AS metric_value,
  unnest(ARRAY['µg/m³', '°C', '%']) AS metric_unit,
  '{"location": "downtown_sf", "sensor_model": "SDS011"}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(10, 1440, 10) AS interval_offset; -- Every 10 minutes

-- Waste Bin Monitor (Fill level)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  '11111111-2222-3333-4444-555555555553'::uuid,
  'lorawan',
  'fill_level',
  LEAST(100, 25 + (interval_offset / 30.0)), -- Gradually filling from 25% to 100%
  '%',
  '{"bin_id": "BIN-MS-042", "capacity_liters": 120}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(25, 1440, 25) AS interval_offset; -- Every 25 minutes

-- Conveyor Belt Vibration Sensor (Industrial)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  '22222222-3333-4444-5555-666666666661'::uuid,
  'lorawan',
  unnest(ARRAY['vibration_x', 'vibration_y', 'vibration_z', 'temperature']) AS metric_name,
  unnest(ARRAY[
    0.5 + RANDOM() * 1.5, -- X-axis: 0.5-2.0g
    0.4 + RANDOM() * 1.2, -- Y-axis: 0.4-1.6g
    0.6 + RANDOM() * 1.4, -- Z-axis: 0.6-2.0g
    55 + RANDOM() * 15 -- Temperature: 55-70°C (running motor)
  ]) AS metric_value,
  unnest(ARRAY['g', 'g', 'g', '°C']) AS metric_unit,
  '{"equipment": "conveyor-belt-1", "rpm": 1200}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(5, 1440, 5) AS interval_offset; -- Every 5 minutes

-- Soil Moisture Sensor (Agriculture)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  '33333333-4444-5555-6666-777777777771'::uuid,
  'lorawan',
  unnest(ARRAY['soil_moisture', 'soil_temperature']) AS metric_name,
  unnest(ARRAY[
    35 + RANDOM() * 15, -- Moisture: 35-50%
    20 + RANDOM() * 5 -- Soil temp: 20-25°C
  ]) AS metric_value,
  unnest(ARRAY['%', '°C']) AS metric_unit,
  '{"field_id": "FIELD-001", "depth_cm": 30}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(30, 1440, 30) AS interval_offset; -- Every 30 minutes

-- ============================================
-- GSM DEVICE TELEMETRY
-- ============================================

-- Vehicle Tracker (GPS, Speed, Battery)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'aaaa1111-bbbb-2222-cccc-333333333001'::uuid,
  'gsm',
  unnest(ARRAY['speed', 'battery_voltage', 'signal_strength']) AS metric_name,
  unnest(ARRAY[
    CASE WHEN interval_offset % 60 < 30 THEN 40 + RANDOM() * 20 ELSE 0 END, -- Speed: 0-60 km/h (alternating)
    4.1 - (interval_offset / 1440.0) * 0.1, -- Battery slowly draining
    85 + RANDOM() * 10 -- Signal: 85-95%
  ]) AS metric_value,
  unnest(ARRAY['km/h', 'V', '%']) AS metric_unit,
  '{"vehicle_id": "TRK-042"}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(3, 1440, 3) AS interval_offset; -- Every 3 minutes

-- Smart Meter (Energy consumption)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'aaaa1111-bbbb-2222-cccc-333333333002'::uuid,
  'gsm',
  'power_consumption',
  CASE
    WHEN EXTRACT(HOUR FROM NOW() - (interval_offset || ' minutes')::INTERVAL) BETWEEN 9 AND 18 THEN 150 + RANDOM() * 100 -- Business hours: 150-250 kW
    ELSE 50 + RANDOM() * 30 -- Off hours: 50-80 kW
  END,
  'kW',
  '{"building_id": "BLDG-005", "phase_count": 3}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(5, 1440, 5) AS interval_offset; -- Every 5 minutes

-- Water Tank Monitor (Level)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'aaaa1111-bbbb-2222-cccc-333333333003'::uuid,
  'gsm',
  'water_level',
  GREATEST(15, 85 - (interval_offset / 20.0)), -- Gradually decreasing from 85% to 15%
  '%',
  '{"reservoir_id": "RES-A", "capacity_gallons": 50000}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(20, 1440, 20) AS interval_offset; -- Every 20 minutes

-- ============================================
-- WIFI DEVICE TELEMETRY
-- ============================================

-- WiFi Temperature Sensor (Office)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'bbbb2222-cccc-3333-dddd-444444444001'::uuid,
  'wifi',
  unnest(ARRAY['temperature', 'humidity', 'signal_strength']) AS metric_name,
  unnest(ARRAY[
    21 + RANDOM() * 3, -- Temperature: 21-24°C (office comfort range)
    40 + RANDOM() * 20, -- Humidity: 40-60%
    93 + RANDOM() * 5 -- Signal: 93-98% (excellent)
  ]) AS metric_value,
  unnest(ARRAY['°C', '%', '%']) AS metric_unit,
  '{"room": "303", "floor": 3}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(2, 1440, 2) AS interval_offset; -- Every 2 minutes

-- Air Quality Monitor (Lab)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'bbbb2222-cccc-3333-dddd-444444444005'::uuid,
  'wifi',
  unnest(ARRAY['pm25', 'voc', 'co2', 'temperature', 'humidity']) AS metric_name,
  unnest(ARRAY[
    5 + RANDOM() * 10, -- PM2.5: 5-15 µg/m³ (clean lab)
    50 + RANDOM() * 100, -- VOC: 50-150 ppb
    400 + RANDOM() * 200, -- CO2: 400-600 ppm (good ventilation)
    22 + RANDOM() * 2, -- Temperature: 22-24°C
    45 + RANDOM() * 15 -- Humidity: 45-60%
  ]) AS metric_value,
  unnest(ARRAY['µg/m³', 'ppb', 'ppm', '°C', '%']) AS metric_unit,
  '{"room": "Lab-205", "lab_type": "clean_room"}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(1, 1440, 1) AS interval_offset; -- Every minute

-- Energy Meter (Solar Panel)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'bbbb2222-cccc-3333-dddd-444444444009'::uuid,
  'wifi',
  unnest(ARRAY['power_generation', 'voltage', 'current']) AS metric_name,
  unnest(ARRAY[
    CASE
      WHEN EXTRACT(HOUR FROM NOW() - (interval_offset || ' minutes')::INTERVAL) BETWEEN 7 AND 18
      THEN (15 - ABS(EXTRACT(HOUR FROM NOW() - (interval_offset || ' minutes')::INTERVAL) - 12.5)) * 3 + RANDOM() * 5
      ELSE RANDOM() * 2 -- Nighttime: minimal generation
    END, -- Solar generation follows sun curve, peak at noon
    240 + RANDOM() * 20, -- Voltage: 240-260V
    CASE
      WHEN EXTRACT(HOUR FROM NOW() - (interval_offset || ' minutes')::INTERVAL) BETWEEN 7 AND 18
      THEN 80 + RANDOM() * 40
      ELSE RANDOM() * 5
    END -- Current varies with sunlight
  ]) AS metric_value,
  unnest(ARRAY['kW', 'V', 'A']) AS metric_unit,
  '{"array_capacity_kw": 50, "panel_count": 120}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(5, 1440, 5) AS interval_offset; -- Every 5 minutes

-- ============================================
-- BLUETOOTH DEVICE TELEMETRY
-- ============================================

-- BLE Temperature Beacon (Freezer)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'cccc3333-dddd-4444-eeee-555555555002'::uuid,
  'bluetooth',
  unnest(ARRAY['temperature', 'humidity', 'battery_level', 'signal_strength']) AS metric_name,
  unnest(ARRAY[
    -18 + RANDOM() * 2, -- Temperature: -18 to -16°C (freezer)
    30 + RANDOM() * 10, -- Humidity: 30-40%
    68 - (interval_offset / 1440.0) * 2, -- Battery slowly draining (68% to 66%)
    83 + RANDOM() * 5 -- Signal: 83-88%
  ]) AS metric_value,
  unnest(ARRAY['°C', '%', '%', '%']) AS metric_unit,
  '{"location": "freezer_a", "alert_threshold_c": -15}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(10, 1440, 10) AS interval_offset; -- Every 10 minutes

-- BLE Heart Rate Monitor (Worker Wearable)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'cccc3333-dddd-4444-eeee-555555555003'::uuid,
  'bluetooth',
  unnest(ARRAY['heart_rate', 'steps', 'battery_level']) AS metric_name,
  unnest(ARRAY[
    65 + RANDOM() * 30, -- Heart rate: 65-95 bpm (varying with activity)
    interval_offset * 0.8, -- Steps accumulating over time
    18 - (interval_offset / 1440.0) * 1 -- Battery draining (18% to 17%)
  ]) AS metric_value,
  unnest(ARRAY['bpm', 'count', '%']) AS metric_unit,
  '{"worker_id": "WRK-042", "shift": "morning"}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(1, 1440, 1) AS interval_offset; -- Every minute

-- BLE Soil Sensor (Agriculture)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'cccc3333-dddd-4444-eeee-555555555006'::uuid,
  'bluetooth',
  unnest(ARRAY['soil_moisture', 'temperature', 'battery_level', 'signal_strength']) AS metric_name,
  unnest(ARRAY[
    38 + RANDOM() * 8, -- Soil moisture: 38-46%
    21 + RANDOM() * 4, -- Temperature: 21-25°C
    5 - (interval_offset / 1440.0) * 0.5, -- Critical battery: 5% to 4.5%
    46 + RANDOM() * 6 -- Weak signal: 46-52%
  ]) AS metric_value,
  unnest(ARRAY['%', '°C', '%', '%']) AS metric_unit,
  '{"plot": "PLOT-007", "alert": "low_battery"}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(15, 1440, 15) AS interval_offset; -- Every 15 minutes

-- BLE Environmental Sensor (Greenhouse)
INSERT INTO device_telemetry (device_id, device_type, metric_name, metric_value, metric_unit, metadata, timestamp)
SELECT
  'cccc3333-dddd-4444-eeee-555555555009'::uuid,
  'bluetooth',
  unnest(ARRAY['temperature', 'humidity', 'pressure', 'co2', 'light', 'battery_level']) AS metric_name,
  unnest(ARRAY[
    CASE
      WHEN EXTRACT(HOUR FROM NOW() - (interval_offset || ' minutes')::INTERVAL) BETWEEN 6 AND 20
      THEN 24 + RANDOM() * 4 -- Daytime: 24-28°C
      ELSE 18 + RANDOM() * 3 -- Nighttime: 18-21°C
    END,
    60 + RANDOM() * 20, -- Humidity: 60-80% (greenhouse)
    1013 + RANDOM() * 10, -- Pressure: 1013-1023 hPa
    450 + RANDOM() * 150, -- CO2: 450-600 ppm
    CASE
      WHEN EXTRACT(HOUR FROM NOW() - (interval_offset || ' minutes')::INTERVAL) BETWEEN 6 AND 20
      THEN 15000 + RANDOM() * 35000 -- Daytime: 15000-50000 lux
      ELSE RANDOM() * 100 -- Nighttime: 0-100 lux
    END,
    82 - (interval_offset / 1440.0) * 1 -- Battery: 82% to 81%
  ]) AS metric_value,
  unnest(ARRAY['°C', '%', 'hPa', 'ppm', 'lux', '%']) AS metric_unit,
  '{"greenhouse": "GH-01", "crop": "tomatoes"}',
  NOW() - (interval_offset || ' minutes')::INTERVAL
FROM generate_series(5, 1440, 5) AS interval_offset; -- Every 5 minutes

-- ============================================
-- STATISTICS
-- ============================================

-- Show telemetry record count by device type
-- SELECT device_type, COUNT(*) as record_count FROM device_telemetry GROUP BY device_type ORDER BY device_type;

-- Show telemetry record count by device
-- SELECT device_id, device_type, COUNT(*) as record_count FROM device_telemetry GROUP BY device_id, device_type ORDER BY record_count DESC;

-- Refresh materialized view for hourly aggregations
-- REFRESH MATERIALIZED VIEW CONCURRENTLY telemetry_hourly_avg;
