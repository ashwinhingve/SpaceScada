-- Seed Data: Bluetooth Devices
-- Description: Populates test data for Bluetooth and BLE devices
-- Location: San Francisco Bay Area, California
-- Protocols: BLE (Bluetooth Low Energy) and Classic Bluetooth

-- ============================================
-- BLUETOOTH DEVICES (10 devices - mix of BLE and Classic)
-- ============================================

INSERT INTO bluetooth_devices (
  id, name, mac_address, application_id, description, status, protocol,
  signal_strength, battery_level, firmware_version, hardware_version, manufacturer,
  last_seen, location, metadata
)
VALUES
  -- Device 1: BLE Beacon, Online, Excellent Signal, High Battery
  (
    'cccc3333-dddd-4444-eeee-555555555001',
    'Asset Tag - Laptop #125',
    'BB:CC:DD:EE:FF:01',
    'app-smartcity-01',
    'BLE asset tracking beacon attached to company laptop',
    'online',
    'BLE',
    92, -- Excellent signal
    95, -- High battery
    '1.2.5',
    'HW-v2.1',
    'Nordic Semiconductor',
    NOW() - INTERVAL '2 minutes',
    '{"latitude": 37.7929, "longitude": -122.3997, "altitude": 142}',
    '{"uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825", "major": 125, "minor": 1, "tx_power": -59, "asset_type": "laptop"}'
  ),
  -- Device 2: BLE Temperature Sensor, Online, Good Signal, Medium Battery
  (
    'cccc3333-dddd-4444-eeee-555555555002',
    'Temp Beacon - Freezer A',
    'BB:CC:DD:EE:FF:02',
    'app-industrial-01',
    'BLE temperature and humidity sensor for cold storage monitoring',
    'online',
    'BLE',
    85, -- Good signal
    68, -- Medium battery
    '2.0.3',
    'HW-v3.0',
    'Texas Instruments',
    NOW() - INTERVAL '5 minutes',
    '{"latitude": 37.7965, "longitude": -122.2801, "altitude": 8}',
    '{"uuid": "A495BB10-C5B1-4B44-B512-1370F02D74DE", "services": ["temperature", "humidity"], "interval_ms": 10000, "range_c": "-40 to 85"}'
  ),
  -- Device 3: BLE Heart Rate Monitor, Online, Excellent Signal, Low Battery (Warning)
  (
    'cccc3333-dddd-4444-eeee-555555555003',
    'Wearable - Worker #042',
    'BB:CC:DD:EE:FF:03',
    'app-industrial-01',
    'BLE wearable for worker health and safety monitoring',
    'online',
    'BLE',
    88, -- Excellent signal
    18, -- Low battery (warning)
    '1.5.8',
    'HW-v1.3',
    'Polar Electro',
    NOW() - INTERVAL '3 minutes',
    '{"latitude": 37.7958, "longitude": -122.2785, "altitude": 12}',
    '{"uuid": "0000180D-0000-1000-8000-00805F9B34FB", "services": ["heart_rate", "step_counter", "fall_detection"], "worker_id": "WRK-042"}'
  ),
  -- Device 4: Classic Bluetooth Headset, Offline
  (
    'cccc3333-dddd-4444-eeee-555555555004',
    'Bluetooth Headset - Manager Office',
    'BB:CC:DD:EE:FF:04',
    'app-smartcity-01',
    'Classic Bluetooth hands-free headset',
    'offline',
    'Classic',
    0, -- Offline
    42, -- Medium battery (last known)
    '4.2.0',
    'HW-v1.0',
    'Plantronics',
    NOW() - INTERVAL '4 hours',
    '{"latitude": 37.7925, "longitude": -122.3992, "altitude": 85}',
    '{"profiles": ["HFP", "HSP", "A2DP"], "codec": "SBC", "range_m": 10}'
  ),
  -- Device 5: BLE Proximity Beacon, Online, Medium Signal, High Battery
  (
    'cccc3333-dddd-4444-eeee-555555555005',
    'Proximity Beacon - Entrance Gate',
    'BB:CC:DD:EE:FF:05',
    'app-smartcity-01',
    'BLE proximity beacon for access control and visitor tracking',
    'online',
    'BLE',
    72, -- Medium signal
    88, -- High battery
    '3.1.2',
    'HW-v4.0',
    'Estimote',
    NOW() - INTERVAL '1 minute',
    '{"latitude": 37.7935, "longitude": -122.3985, "altitude": 5}',
    '{"uuid": "B9407F30-F5F8-466E-AFF9-25556B57FE6D", "major": 100, "minor": 5, "tx_power": -65, "range_m": 50, "location": "gate_1"}'
  ),
  -- Device 6: BLE Soil Sensor, Error State, Weak Signal, Critical Battery
  (
    'cccc3333-dddd-4444-eeee-555555555006',
    'BLE Soil Sensor - Field Plot 7',
    'BB:CC:DD:EE:FF:06',
    'app-agriculture-01',
    'BLE soil moisture and temperature sensor for precision agriculture',
    'error',
    'BLE',
    48, -- Weak signal
    5, -- Critical battery
    '1.8.1',
    'HW-v2.0',
    'Xiaomi',
    NOW() - INTERVAL '45 minutes',
    '{"latitude": 38.3001, "longitude": -122.2855, "altitude": 25}',
    '{"uuid": "0000181A-0000-1000-8000-00805F9B34FB", "services": ["soil_moisture", "temperature"], "error": "low_battery", "plot": "PLOT-007"}'
  ),
  -- Device 7: BLE Fitness Tracker, Online, Good Signal, Good Battery
  (
    'cccc3333-dddd-4444-eeee-555555555007',
    'Fitness Tracker - Security Guard',
    'BB:CC:DD:EE:FF:07',
    'app-smartcity-01',
    'BLE fitness tracker for security personnel monitoring',
    'online',
    'BLE',
    78, -- Good signal
    75, -- Good battery
    '5.0.2',
    'HW-v3.5',
    'Fitbit',
    NOW() - INTERVAL '4 minutes',
    '{"latitude": 37.7880, "longitude": -122.4080, "altitude": 15}',
    '{"uuid": "ADABFB00-6E7D-4601-BDA2-BFFAA68956BA", "services": ["heart_rate", "steps", "sleep", "gps"], "guard_id": "SEC-015"}'
  ),
  -- Device 8: Classic Bluetooth Scanner, Online, Excellent Signal, Powered
  (
    'cccc3333-dddd-4444-eeee-555555555008',
    'Barcode Scanner - Warehouse B',
    'BB:CC:DD:EE:FF:08',
    'app-industrial-01',
    'Classic Bluetooth barcode scanner for inventory management',
    'online',
    'Classic',
    90, -- Excellent signal
    100, -- Powered (charging dock)
    '2.5.0',
    'HW-v2.8',
    'Zebra Technologies',
    NOW() - INTERVAL '8 minutes',
    '{"latitude": 37.7971, "longitude": -122.2794, "altitude": 15}',
    '{"profiles": ["SPP", "HID"], "scan_rate_scans_sec": 100, "symbologies": ["Code 39", "Code 128", "QR"], "warehouse": "WH-B"}'
  ),
  -- Device 9: BLE Environmental Sensor, Online, Medium Signal, Good Battery
  (
    'cccc3333-dddd-4444-eeee-555555555009',
    'Multi-Sensor - Greenhouse Control',
    'BB:CC:DD:EE:FF:09',
    'app-agriculture-01',
    'BLE multi-sensor for greenhouse environmental monitoring',
    'online',
    'BLE',
    65, -- Medium signal
    82, -- Good battery
    '1.9.4',
    'HW-v2.5',
    'Sensirion',
    NOW() - INTERVAL '12 minutes',
    '{"latitude": 38.2985, "longitude": -122.2879, "altitude": 32}',
    '{"uuid": "00002A6E-0000-1000-8000-00805F9B34FB", "services": ["temperature", "humidity", "pressure", "co2", "light"], "greenhouse": "GH-01"}'
  ),
  -- Device 10: BLE Smart Lock, Online, Good Signal, Medium Battery
  (
    'cccc3333-dddd-4444-eeee-555555555010',
    'Smart Lock - Server Room',
    'BB:CC:DD:EE:FF:0A',
    'app-smartcity-01',
    'BLE-enabled smart lock for secure access control',
    'online',
    'BLE',
    80, -- Good signal
    55, -- Medium battery
    '4.1.0',
    'HW-v3.2',
    'August Home',
    NOW() - INTERVAL '10 minutes',
    '{"latitude": 37.7928, "longitude": -122.3995, "altitude": 50}',
    '{"uuid": "0000FFF0-0000-1000-8000-00805F9B34FB", "services": ["lock_control", "access_log"], "location": "server_room_3", "encryption": "AES-256"}'
  );
