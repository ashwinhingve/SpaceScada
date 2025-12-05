-- Seed Data: GSM Devices
-- Description: Populates test data for GSM/cellular devices
-- Location: San Francisco Bay Area, California

-- ============================================
-- BASE DEVICES TABLE (8 GSM devices)
-- ============================================

INSERT INTO devices (id, device_id, name, description, device_type, status, latitude, longitude, altitude, location_name, tags, metadata, created_at, updated_at, last_seen)
VALUES
  -- GSM Device 1: Online, Excellent Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333001',
    'GSM-ESP32-001',
    'Vehicle Tracker - Truck 42',
    'GPS tracker for delivery truck fleet management',
    'GSM_ESP32',
    'ONLINE',
    37.7749,
    -122.4194,
    15,
    'San Francisco, CA',
    '["fleet", "tracking", "delivery"]',
    '{"vehicle_id": "TRK-042", "driver": "John Smith"}',
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '3 minutes',
    NOW() - INTERVAL '3 minutes'
  ),
  -- GSM Device 2: Online, Good Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333002',
    'GSM-ESP32-002',
    'Smart Meter - Building 5',
    'Electricity consumption monitoring for commercial building',
    'GSM_ESP32',
    'ONLINE',
    37.7849,
    -122.4070,
    125,
    'San Francisco Financial District',
    '["energy", "metering", "commercial"]',
    '{"building_id": "BLDG-005", "tenant": "TechCorp Inc"}',
    NOW() - INTERVAL '68 days',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '5 minutes'
  ),
  -- GSM Device 3: Online, Medium Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333003',
    'GSM-ESP32-003',
    'Water Tank Monitor - Reservoir A',
    'Remote water level monitoring for municipal reservoir',
    'GSM_ESP32',
    'ONLINE',
    37.8044,
    -122.2712,
    50,
    'Oakland Hills',
    '["water", "infrastructure", "municipal"]',
    '{"reservoir_id": "RES-A", "capacity_gallons": 50000}',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes'
  ),
  -- GSM Device 4: Offline
  (
    'aaaa1111-bbbb-2222-cccc-333333333004',
    'GSM-ESP32-004',
    'Weather Station - Bay Bridge',
    'Environmental monitoring station on Bay Bridge',
    'GSM_ESP32',
    'OFFLINE',
    37.7983,
    -122.3778,
    72,
    'Bay Bridge, SF',
    '["weather", "environmental", "infrastructure"]',
    '{"station_id": "WX-BAY-01", "sensors": ["temp", "humidity", "wind", "rain"]}',
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  ),
  -- GSM Device 5: Online, Excellent Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333005',
    'GSM-ESP32-005',
    'Asset Tracker - Container 128',
    'Shipping container location and temperature monitoring',
    'GSM_ESP32',
    'ONLINE',
    37.7955,
    -122.3937,
    8,
    'Port of Oakland',
    '["shipping", "logistics", "cold-chain"]',
    '{"container_id": "CONT-128", "cargo_type": "refrigerated"}',
    NOW() - INTERVAL '48 days',
    NOW() - INTERVAL '2 minutes',
    NOW() - INTERVAL '2 minutes'
  ),
  -- GSM Device 6: Error State
  (
    'aaaa1111-bbbb-2222-cccc-333333333006',
    'GSM-ESP32-006',
    'Parking Lot Monitor - BART Station',
    'Parking availability counter for BART station lot',
    'GSM_ESP32',
    'ERROR',
    37.8040,
    -122.2694,
    45,
    'Oakland Rockridge BART',
    '["parking", "transit", "public"]',
    '{"station": "Rockridge", "total_spaces": 500}',
    NOW() - INTERVAL '42 days',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  ),
  -- GSM Device 7: Online, Poor Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333007',
    'GSM-ESP32-007',
    'Soil Sensor - Vineyard Plot 3',
    'Soil moisture and temperature for wine grape cultivation',
    'GSM_ESP32',
    'ONLINE',
    38.2975,
    -122.2869,
    25,
    'Napa Valley, CA',
    '["agriculture", "viticulture", "irrigation"]',
    '{"plot_id": "PLOT-003", "grape_variety": "Cabernet Sauvignon"}',
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '25 minutes',
    NOW() - INTERVAL '25 minutes'
  ),
  -- GSM Device 8: Online, Good Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333008',
    'GSM-ESP32-008',
    'Generator Monitor - Hospital Backup',
    'Backup generator status monitoring for SF General Hospital',
    'GSM_ESP32',
    'ONLINE',
    37.7551,
    -122.4057,
    52,
    'Mission District, SF',
    '["healthcare", "power", "critical-infrastructure"]',
    '{"facility": "SF General Hospital", "generator_capacity_kw": 2000}',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '7 minutes',
    NOW() - INTERVAL '7 minutes'
  );

-- ============================================
-- GSM_DEVICES TABLE (Device-specific config)
-- ============================================

INSERT INTO gsm_devices (
  device_id, imei, iccid, imsi, apn, apn_username, apn_password,
  mqtt_client_id, mqtt_username, mqtt_password, mqtt_broker_host, mqtt_broker_port, mqtt_use_tls, mqtt_topic_prefix,
  modem_model, firmware_version, signal_strength, signal_quality, network_type, operator,
  battery_voltage, battery_percentage, power_mode, publish_interval, heartbeat_interval, enable_ota
)
VALUES
  -- Device 1: AT&T, LTE, Excellent Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333001',
    '860425050123456',
    '89014103272345678901',
    '310410123456789',
    'phone',
    '',
    '',
    'gsm-esp32-001-mqtt',
    'device001',
    'mqtt_pass_001',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-001',
    'SIM7600',
    '2.1.0',
    28, -- Excellent RSSI
    92, -- 92% quality
    'LTE',
    'AT&T',
    4.15,
    98,
    'NORMAL',
    30000,
    300000,
    true
  ),
  -- Device 2: Verizon, 4G, Good Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333002',
    '860425050234567',
    '89014103272345678902',
    '310410123456790',
    'vzwinternet',
    '',
    '',
    'gsm-esp32-002-mqtt',
    'device002',
    'mqtt_pass_002',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-002',
    'SIM7600',
    '2.1.0',
    24,  -- Good RSSI
    85, -- 85% quality
    '4G',
    'Verizon',
    3.98,
    92,
    'NORMAL',
    60000,
    300000,
    true
  ),
  -- Device 3: T-Mobile, 4G, Medium Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333003',
    '860425050345678',
    '89014103272345678903',
    '310410123456791',
    'fast.t-mobile.com',
    '',
    '',
    'gsm-esp32-003-mqtt',
    'device003',
    'mqtt_pass_003',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-003',
    'SIM800',
    '1.5.2',
    18, -- Medium RSSI
    68, -- 68% quality
    '4G',
    'T-Mobile',
    3.75,
    78,
    'NORMAL',
    120000,
    600000,
    true
  ),
  -- Device 4: AT&T, 4G, Offline (last known good)
  (
    'aaaa1111-bbbb-2222-cccc-333333333004',
    '860425050456789',
    '89014103272345678904',
    '310410123456792',
    'phone',
    '',
    '',
    'gsm-esp32-004-mqtt',
    'device004',
    'mqtt_pass_004',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-004',
    'SIM7600',
    '2.0.5',
    20,
    75,
    '4G',
    'AT&T',
    3.45,
    52,
    'LOW_POWER',
    300000,
    900000,
    true
  ),
  -- Device 5: Verizon, LTE, Excellent Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333005',
    '860425050567890',
    '89014103272345678905',
    '310410123456793',
    'vzwinternet',
    '',
    '',
    'gsm-esp32-005-mqtt',
    'device005',
    'mqtt_pass_005',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-005',
    'SIM7600',
    '2.1.0',
    29, -- Excellent RSSI
    95, -- 95% quality
    'LTE',
    'Verizon',
    12.5, -- External power
    100,
    'NORMAL',
    15000,
    180000,
    true
  ),
  -- Device 6: T-Mobile, 3G, Error State
  (
    'aaaa1111-bbbb-2222-cccc-333333333006',
    '860425050678901',
    '89014103272345678906',
    '310410123456794',
    'fast.t-mobile.com',
    '',
    '',
    'gsm-esp32-006-mqtt',
    'device006',
    'mqtt_pass_006',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-006',
    'SIM800',
    '1.4.8',
    12, -- Poor RSSI
    45, -- 45% quality
    '3G',
    'T-Mobile',
    3.25,
    38,
    'NORMAL',
    180000,
    600000,
    false
  ),
  -- Device 7: AT&T, 4G, Poor Signal (rural)
  (
    'aaaa1111-bbbb-2222-cccc-333333333007',
    '860425050789012',
    '89014103272345678907',
    '310410123456795',
    'phone',
    '',
    '',
    'gsm-esp32-007-mqtt',
    'device007',
    'mqtt_pass_007',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-007',
    'SIM7600',
    '2.0.8',
    14, -- Poor RSSI (rural area)
    52, -- 52% quality
    '4G',
    'AT&T',
    3.82,
    85,
    'NORMAL',
    180000,
    900000,
    true
  ),
  -- Device 8: Verizon, LTE, Good Signal
  (
    'aaaa1111-bbbb-2222-cccc-333333333008',
    '860425050890123',
    '89014103272345678908',
    '310410123456796',
    'vzwinternet',
    '',
    '',
    'gsm-esp32-008-mqtt',
    'device008',
    'mqtt_pass_008',
    'mqtt.webscada.io',
    8883,
    true,
    'webscada/gsm/esp32-008',
    'SIM7600',
    '2.1.0',
    26, -- Good RSSI
    88, -- 88% quality
    'LTE',
    'Verizon',
    12.3, -- External power (hospital backup)
    100,
    'NORMAL',
    30000,
    180000,
    true
  );

-- ============================================
-- GSM MESSAGES (SMS) - Sample messages
-- ============================================

INSERT INTO gsm_messages (id, device_id, direction, phone_number, message, status, timestamp, delivered_at, read_at)
VALUES
  -- Outbound alerts
  ('sms-001', 'aaaa1111-bbbb-2222-cccc-333333333001', 'OUTBOUND', '+14155551234', 'Vehicle TRK-042 has arrived at destination', 'DELIVERED', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NULL),
  ('sms-002', 'aaaa1111-bbbb-2222-cccc-333333333002', 'OUTBOUND', '+14155555678', 'Alert: Power consumption exceeded threshold in BLDG-005', 'DELIVERED', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', NULL),
  ('sms-003', 'aaaa1111-bbbb-2222-cccc-333333333003', 'OUTBOUND', '+14155559012', 'Water level low in RES-A: 15% remaining', 'SENT', NOW() - INTERVAL '1 hour', NULL, NULL),
  ('sms-004', 'aaaa1111-bbbb-2222-cccc-333333333008', 'OUTBOUND', '+14155553456', 'Generator test completed successfully', 'DELIVERED', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NULL),

  -- Inbound commands
  ('sms-005', 'aaaa1111-bbbb-2222-cccc-333333333001', 'INBOUND', '+14155551234', 'STATUS', 'RECEIVED', NOW() - INTERVAL '3 hours', NULL, NOW() - INTERVAL '3 hours'),
  ('sms-006', 'aaaa1111-bbbb-2222-cccc-333333333002', 'INBOUND', '+14155555678', 'RESET', 'RECEIVED', NOW() - INTERVAL '6 hours', NULL, NOW() - INTERVAL '6 hours'),
  ('sms-007', 'aaaa1111-bbbb-2222-cccc-333333333005', 'INBOUND', '+14155557890', 'GET_LOCATION', 'RECEIVED', NOW() - INTERVAL '4 hours', NULL, NOW() - INTERVAL '4 hours'),

  -- Failed messages
  ('sms-008', 'aaaa1111-bbbb-2222-cccc-333333333006', 'OUTBOUND', '+14155559999', 'Parking lot monitor offline', 'FAILED', NOW() - INTERVAL '1 hour', NULL, NULL),

  -- Recent messages
  ('sms-009', 'aaaa1111-bbbb-2222-cccc-333333333001', 'OUTBOUND', '+14155551234', 'Current location: 37.7749,-122.4194', 'DELIVERED', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes', NULL),
  ('sms-010', 'aaaa1111-bbbb-2222-cccc-333333333007', 'OUTBOUND', '+14155552222', 'Soil moisture: 42%, Temperature: 22C', 'DELIVERED', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes', NULL);

-- ============================================
-- GSM LOCATIONS (GPS tracking history)
-- ============================================

-- Vehicle Tracker (Device 1) - moving route
INSERT INTO gsm_locations (device_id, latitude, longitude, altitude, speed, heading, accuracy, satellites, hdop, fix, timestamp)
VALUES
  ('aaaa1111-bbbb-2222-cccc-333333333001', 37.7749, -122.4194, 15, 0, 0, 5.2, 10, 1.1, '3D', NOW() - INTERVAL '3 minutes'),
  ('aaaa1111-bbbb-2222-cccc-333333333001', 37.7755, -122.4180, 18, 35, 45, 4.8, 11, 1.0, '3D', NOW() - INTERVAL '10 minutes'),
  ('aaaa1111-bbbb-2222-cccc-333333333001', 37.7770, -122.4165, 22, 42, 48, 5.0, 10, 1.1, '3D', NOW() - INTERVAL '20 minutes'),
  ('aaaa1111-bbbb-2222-cccc-333333333001', 37.7790, -122.4145, 25, 38, 52, 5.5, 9, 1.2, '3D', NOW() - INTERVAL '30 minutes');

-- Asset Tracker (Device 5) - stationary at port
INSERT INTO gsm_locations (device_id, latitude, longitude, altitude, speed, heading, accuracy, satellites, hdop, fix, timestamp)
VALUES
  ('aaaa1111-bbbb-2222-cccc-333333333005', 37.7955, -122.3937, 8, 0, 0, 3.2, 12, 0.9, '3D', NOW() - INTERVAL '2 minutes'),
  ('aaaa1111-bbbb-2222-cccc-333333333005', 37.7955, -122.3937, 8, 0, 0, 3.1, 12, 0.9, '3D', NOW() - INTERVAL '1 hour'),
  ('aaaa1111-bbbb-2222-cccc-333333333005', 37.7955, -122.3937, 8, 0, 0, 3.3, 11, 0.9, '3D', NOW() - INTERVAL '2 hours');

-- ============================================
-- GSM NETWORK LOGS (Network status history)
-- ============================================

-- Device 1: AT&T LTE - stable connection
INSERT INTO gsm_network_logs (device_id, operator, signal_strength, signal_quality, network_type, registered, roaming, ip_address, imei, iccid, sim_status, data_sent_bytes, data_received_bytes, timestamp)
VALUES
  ('aaaa1111-bbbb-2222-cccc-333333333001', 'AT&T', 28, 92, 'LTE', true, false, '10.234.56.78', '860425050123456', '89014103272345678901', 'READY', 524288, 131072, NOW() - INTERVAL '3 minutes'),
  ('aaaa1111-bbbb-2222-cccc-333333333001', 'AT&T', 27, 90, 'LTE', true, false, '10.234.56.78', '860425050123456', '89014103272345678901', 'READY', 518144, 129024, NOW() - INTERVAL '1 hour'),
  ('aaaa1111-bbbb-2222-cccc-333333333001', 'AT&T', 29, 94, 'LTE', true, false, '10.234.56.78', '860425050123456', '89014103272345678901', 'READY', 512000, 128000, NOW() - INTERVAL '2 hours');

-- Device 2: Verizon 4G - stable connection
INSERT INTO gsm_network_logs (device_id, operator, signal_strength, signal_quality, network_type, registered, roaming, ip_address, imei, iccid, sim_status, data_sent_bytes, data_received_bytes, timestamp)
VALUES
  ('aaaa1111-bbbb-2222-cccc-333333333002', 'Verizon', 24, 85, '4G', true, false, '10.156.78.90', '860425050234567', '89014103272345678902', 'READY', 1048576, 262144, NOW() - INTERVAL '5 minutes'),
  ('aaaa1111-bbbb-2222-cccc-333333333002', 'Verizon', 25, 87, '4G', true, false, '10.156.78.90', '860425050234567', '89014103272345678902', 'READY', 1024000, 256000, NOW() - INTERVAL '1 hour');

-- Device 6: T-Mobile 3G - poor connection (error state)
INSERT INTO gsm_network_logs (device_id, operator, signal_strength, signal_quality, network_type, registered, roaming, ip_address, imei, iccid, sim_status, data_sent_bytes, data_received_bytes, timestamp)
VALUES
  ('aaaa1111-bbbb-2222-cccc-333333333006', 'T-Mobile', 12, 45, '3G', true, false, '10.89.12.34', '860425050678901', '89014103272345678906', 'READY', 65536, 16384, NOW() - INTERVAL '1 hour'),
  ('aaaa1111-bbbb-2222-cccc-333333333006', 'T-Mobile', 10, 38, '3G', false, false, NULL, '860425050678901', '89014103272345678906', 'READY', 61440, 15360, NOW() - INTERVAL '2 hours');

-- ============================================
-- GSM COMMANDS (AT command history)
-- ============================================

INSERT INTO gsm_commands (id, device_id, command, response, status, sent_at, completed_at)
VALUES
  ('cmd-001', 'aaaa1111-bbbb-2222-cccc-333333333001', 'AT+CPIN?', '+CPIN: READY', 'SUCCESS', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('cmd-002', 'aaaa1111-bbbb-2222-cccc-333333333001', 'AT+CSQ', '+CSQ: 28,0', 'SUCCESS', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('cmd-003', 'aaaa1111-bbbb-2222-cccc-333333333002', 'AT+CGPS=1', 'OK', 'SUCCESS', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('cmd-004', 'aaaa1111-bbbb-2222-cccc-333333333005', 'AT+CGNSINF', '+CGNSINF: 1,1,20231201120000.000,37.7955,-122.3937,8.2,0.0,0,0,,,2.5,1.1,0.9,,12,5,,,40,,', 'SUCCESS', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
  ('cmd-005', 'aaaa1111-bbbb-2222-cccc-333333333006', 'AT+CREG?', '+CREG: 0,1', 'FAILED', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('cmd-006', 'aaaa1111-bbbb-2222-cccc-333333333008', 'AT+CPSI?', '+CPSI: LTE,Online,310-410,0x1234,12345678,450,EUTRAN-BAND12,5230,3,3,-105,-12,-72,8', 'SUCCESS', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');
