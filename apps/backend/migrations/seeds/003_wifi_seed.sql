-- Seed Data: WiFi Devices
-- Description: Populates test data for WiFi-enabled IoT devices
-- Location: San Francisco Bay Area, California
-- Chipsets: ESP32, ESP8266, ESP32-C3, ESP32-S2, ESP32-S3

-- ============================================
-- WIFI DEVICES (10 devices with various chipsets and statuses)
-- ============================================

INSERT INTO wifi_devices (
  id, name, mac_address, application_id, description, status,
  ssid, signal_strength, ip_address, chipset, firmware_version,
  last_seen, location, metadata
)
VALUES
  -- Device 1: ESP32, Online, Excellent Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444001',
    'Temp Sensor - Office Floor 3',
    'AA:BB:CC:DD:EE:01',
    'app-smartcity-01',
    'Temperature and humidity sensor for office environment monitoring',
    'online',
    'WebSCADA-IoT-5G',
    95, -- Excellent signal
    '192.168.1.101',
    'ESP32',
    '1.5.2',
    NOW() - INTERVAL '2 minutes',
    '{"latitude": 37.7929, "longitude": -122.3997, "altitude": 142}',
    '{"room": "303", "floor": 3, "building": "Office Tower A"}'
  ),
  -- Device 2: ESP8266, Online, Good Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444002',
    'Door Sensor - Main Entrance',
    'AA:BB:CC:DD:EE:02',
    'app-smartcity-01',
    'Magnetic door sensor with WiFi connectivity',
    'online',
    'WebSCADA-IoT-5G',
    82, -- Good signal
    '192.168.1.102',
    'ESP8266',
    '2.7.4',
    NOW() - INTERVAL '5 minutes',
    '{"latitude": 37.7935, "longitude": -122.3985, "altitude": 5}',
    '{"location": "main_entrance", "type": "magnetic_sensor"}'
  ),
  -- Device 3: ESP32-C3, Online, Medium Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444003',
    'Motion Detector - Warehouse A',
    'AA:BB:CC:DD:EE:03',
    'app-industrial-01',
    'PIR motion sensor for warehouse security',
    'online',
    'Warehouse-WiFi',
    68, -- Medium signal
    '192.168.10.25',
    'ESP32-C3',
    '1.0.8',
    NOW() - INTERVAL '8 minutes',
    '{"latitude": 37.7955, "longitude": -122.2797, "altitude": 5}',
    '{"zone": "A", "coverage_radius_m": 10}'
  ),
  -- Device 4: ESP32, Offline
  (
    'bbbb2222-cccc-3333-dddd-444444444004',
    'Water Leak Sensor - Basement',
    'AA:BB:CC:DD:EE:04',
    'app-smartcity-01',
    'Water leak detection sensor for flood prevention',
    'offline',
    'WebSCADA-IoT-5G',
    0, -- Offline, no signal
    NULL,
    'ESP32',
    '1.4.5',
    NOW() - INTERVAL '3 hours',
    '{"latitude": 37.7920, "longitude": -122.4005, "altitude": -5}',
    '{"location": "basement_level_b1", "type": "water_leak"}'
  ),
  -- Device 5: ESP32-S2, Online, Excellent Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444005',
    'Air Quality Monitor - Lab Room',
    'AA:BB:CC:DD:EE:05',
    'app-industrial-01',
    'Multi-sensor air quality monitor (PM2.5, VOC, CO2)',
    'online',
    'Lab-Network-5G',
    91, -- Excellent signal
    '10.0.50.15',
    'ESP32-S2',
    '1.2.1',
    NOW() - INTERVAL '3 minutes',
    '{"latitude": 37.7965, "longitude": -122.2801, "altitude": 8}',
    '{"room": "Lab-205", "sensors": ["PM2.5", "VOC", "CO2", "temp", "humidity"]}'
  ),
  -- Device 6: ESP8266, Error State
  (
    'bbbb2222-cccc-3333-dddd-444444444006',
    'Smart Plug - Conference Room',
    'AA:BB:CC:DD:EE:06',
    'app-smartcity-01',
    'WiFi-controlled power outlet with energy monitoring',
    'error',
    'WebSCADA-IoT-2.4G',
    45, -- Weak signal causing errors
    '192.168.1.155',
    'ESP8266',
    '2.6.3',
    NOW() - INTERVAL '30 minutes',
    '{"latitude": 37.7925, "longitude": -122.3992, "altitude": 85}',
    '{"room": "conf_room_b", "max_load_w": 1500, "error": "connection_unstable"}'
  ),
  -- Device 7: ESP32-S3, Online, Good Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444007',
    'Camera Monitor - Parking Lot',
    'AA:BB:CC:DD:EE:07',
    'app-smartcity-01',
    'WiFi camera with motion detection and night vision',
    'online',
    'Security-Cam-Network',
    78, -- Good signal
    '192.168.2.50',
    'ESP32-S3',
    '2.0.3',
    NOW() - INTERVAL '1 minute',
    '{"latitude": 37.7880, "longitude": -122.4080, "altitude": 15}',
    '{"location": "parking_lot_north", "resolution": "1080p", "features": ["motion_detect", "night_vision"]}'
  ),
  -- Device 8: ESP32, Online, Weak Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444008',
    'Soil Moisture - Greenhouse 2',
    'AA:BB:CC:DD:EE:08',
    'app-agriculture-01',
    'Capacitive soil moisture sensor for greenhouse irrigation',
    'online',
    'Farm-IoT',
    52, -- Weak signal (rural area)
    '192.168.100.42',
    'ESP32',
    '1.3.7',
    NOW() - INTERVAL '15 minutes',
    '{"latitude": 38.2985, "longitude": -122.2879, "altitude": 32}',
    '{"greenhouse": "GH-02", "crop": "tomatoes", "depth_cm": 20}'
  ),
  -- Device 9: ESP32-C3, Online, Excellent Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444009',
    'Energy Meter - Solar Panel Array',
    'AA:BB:CC:DD:EE:09',
    'app-industrial-01',
    'WiFi energy meter for solar panel monitoring',
    'online',
    'Solar-Monitoring',
    88, -- Excellent signal
    '10.10.10.100',
    'ESP32-C3',
    '1.1.5',
    NOW() - INTERVAL '4 minutes',
    '{"latitude": 37.7971, "longitude": -122.2794, "altitude": 25}',
    '{"array_capacity_kw": 50, "panels": 120, "type": "solar_monitoring"}'
  ),
  -- Device 10: ESP8266, Online, Medium Signal
  (
    'bbbb2222-cccc-3333-dddd-444444444010',
    'Light Controller - Hallway Floor 2',
    'AA:BB:CC:DD:EE:0A',
    'app-smartcity-01',
    'Smart LED strip controller with WiFi dimming',
    'online',
    'WebSCADA-IoT-2.4G',
    65, -- Medium signal
    '192.168.1.175',
    'ESP8266',
    '2.7.1',
    NOW() - INTERVAL '6 minutes',
    '{"latitude": 37.7928, "longitude": -122.3995, "altitude": 50}',
    '{"location": "hallway_floor_2", "led_count": 300, "protocol": "WS2812B"}'
  );
