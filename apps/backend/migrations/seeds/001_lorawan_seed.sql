-- Seed Data: LoRaWAN Applications, Gateways, and Devices
-- Description: Populates test data for LoRaWAN network infrastructure
-- Location: San Francisco Bay Area, California

-- ============================================
-- APPLICATIONS (3 applications)
-- ============================================

INSERT INTO applications (id, application_id, name, description, tenant_id, device_count, status, last_activity, created_at, updated_at)
VALUES
  (
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'app-smartcity-01',
    'Smart City Infrastructure',
    'IoT sensors for smart city monitoring including parking, waste management, and air quality',
    'tenant-sf-city',
    4,
    'active',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '15 minutes'
  ),
  (
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'app-industrial-01',
    'Industrial IoT Monitoring',
    'Factory equipment monitoring, predictive maintenance, and energy management',
    'tenant-factory',
    3,
    'active',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '5 minutes'
  ),
  (
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'app-agriculture-01',
    'Smart Agriculture',
    'Soil moisture sensors, weather stations, and livestock tracking',
    'tenant-farm',
    3,
    'active',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '30 minutes'
  );

-- ============================================
-- GATEWAYS (4 gateways across SF Bay Area)
-- ============================================

INSERT INTO gateways (id, gateway_eui, name, description, frequency_plan, status, last_seen, location, tenant_id, metadata, created_at, updated_at)
VALUES
  (
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    'AA555A0000000001',
    'SF Downtown Gateway',
    'Gateway at 101 California St, San Francisco',
    'US915',
    'online',
    NOW() - INTERVAL '2 minutes',
    '{"latitude": 37.7929, "longitude": -122.3997, "altitude": 142}',
    'tenant-sf-city',
    '{"model": "The Things Indoor Gateway", "version": "1.0.5"}',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '2 minutes'
  ),
  (
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'AA555A0000000002',
    'Mission District Gateway',
    'Gateway at Mission Street, San Francisco',
    'US915',
    'online',
    NOW() - INTERVAL '1 minute',
    '{"latitude": 37.7599, "longitude": -122.4148, "altitude": 18}',
    'tenant-sf-city',
    '{"model": "RAK7248", "version": "2.1.3"}',
    NOW() - INTERVAL '100 days',
    NOW() - INTERVAL '1 minute'
  ),
  (
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'AA555A0000000003',
    'Oakland Industrial Gateway',
    'Gateway at Oakland Port Industrial Area',
    'US915',
    'online',
    NOW() - INTERVAL '5 minutes',
    '{"latitude": 37.7955, "longitude": -122.2797, "altitude": 5}',
    'tenant-factory',
    '{"model": "Multitech Conduit", "version": "5.3.0"}',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '5 minutes'
  ),
  (
    'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    'AA555A0000000004',
    'Napa Valley Farm Gateway',
    'Gateway at Napa Valley Agricultural Area',
    'US915',
    'offline',
    NOW() - INTERVAL '2 hours',
    '{"latitude": 38.2975, "longitude": -122.2869, "altitude": 30}',
    'tenant-farm',
    '{"model": "The Things Gateway", "version": "1.1.0"}',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '2 hours'
  );

-- ============================================
-- LORAWAN DEVICES (10 devices)
-- ============================================

-- Smart City Devices (4 devices)
INSERT INTO lorawan_devices (id, dev_eui, name, description, application_id, device_class, activation_mode, status, device_profile_id, last_seen, location, metadata, created_at, updated_at)
VALUES
  (
    '11111111-2222-3333-4444-555555555551',
    '70B3D57ED0050001',
    'Parking Sensor - Lot A',
    'Ultrasonic parking space occupancy sensor',
    'app-smartcity-01',
    'A',
    'OTAA',
    'online',
    'profile-parking-sensor',
    NOW() - INTERVAL '15 minutes',
    '{"latitude": 37.7879, "longitude": -122.4075, "altitude": 10}',
    '{"type": "parking", "lot": "Lot A", "space": "A-15"}',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '15 minutes'
  ),
  (
    '11111111-2222-3333-4444-555555555552',
    '70B3D57ED0050002',
    'Air Quality Sensor - Downtown',
    'Multi-sensor air quality monitor (PM2.5, PM10, NO2, CO2)',
    'app-smartcity-01',
    'A',
    'OTAA',
    'online',
    'profile-air-quality',
    NOW() - INTERVAL '10 minutes',
    '{"latitude": 37.7939, "longitude": -122.3963, "altitude": 15}',
    '{"type": "environmental", "sensors": ["PM2.5", "PM10", "NO2", "CO2"]}',
    NOW() - INTERVAL '88 days',
    NOW() - INTERVAL '10 minutes'
  ),
  (
    '11111111-2222-3333-4444-555555555553',
    '70B3D57ED0050003',
    'Waste Bin Monitor - Market St',
    'Ultrasonic fill-level sensor for waste bins',
    'app-smartcity-01',
    'A',
    'OTAA',
    'online',
    'profile-waste-sensor',
    NOW() - INTERVAL '25 minutes',
    '{"latitude": 37.7751, "longitude": -122.4175, "altitude": 8}',
    '{"type": "waste", "bin_id": "BIN-MS-042", "capacity_liters": 120}',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '25 minutes'
  ),
  (
    '11111111-2222-3333-4444-555555555554',
    '70B3D57ED0050004',
    'Street Light Monitor - 3rd Ave',
    'Smart street light with energy monitoring',
    'app-smartcity-01',
    'C',
    'ABP',
    'offline',
    'profile-street-light',
    NOW() - INTERVAL '3 hours',
    '{"latitude": 37.7699, "longitude": -122.4059, "altitude": 12}',
    '{"type": "lighting", "pole_id": "SL-3AV-128", "power_w": 150}',
    NOW() - INTERVAL '82 days',
    NOW() - INTERVAL '3 hours'
  );

-- Industrial Devices (3 devices)
INSERT INTO lorawan_devices (id, dev_eui, name, description, application_id, device_class, activation_mode, status, device_profile_id, last_seen, location, metadata, created_at, updated_at)
VALUES
  (
    '22222222-3333-4444-5555-666666666661',
    '70B3D57ED0050011',
    'Conveyor Belt Vibration Sensor',
    'Triaxial vibration sensor for predictive maintenance',
    'app-industrial-01',
    'A',
    'OTAA',
    'online',
    'profile-vibration',
    NOW() - INTERVAL '5 minutes',
    '{"latitude": 37.7965, "longitude": -122.2801, "altitude": 8}',
    '{"type": "vibration", "equipment": "conveyor-belt-1", "threshold_g": 2.5}',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '5 minutes'
  ),
  (
    '22222222-3333-4444-5555-666666666662',
    '70B3D57ED0050012',
    'Tank Level Sensor - T1',
    'Pressure-based liquid level sensor',
    'app-industrial-01',
    'B',
    'OTAA',
    'online',
    'profile-tank-level',
    NOW() - INTERVAL '8 minutes',
    '{"latitude": 37.7958, "longitude": -122.2785, "altitude": 12}',
    '{"type": "level", "tank_id": "TANK-001", "capacity_liters": 5000}',
    NOW() - INTERVAL '58 days',
    NOW() - INTERVAL '8 minutes'
  ),
  (
    '22222222-3333-4444-5555-666666666663',
    '70B3D57ED0050013',
    'Energy Meter - Building A',
    'Three-phase energy consumption monitor',
    'app-industrial-01',
    'C',
    'ABP',
    'online',
    'profile-energy-meter',
    NOW() - INTERVAL '2 minutes',
    '{"latitude": 37.7971, "longitude": -122.2794, "altitude": 15}',
    '{"type": "energy", "building": "A", "phases": 3, "max_current_a": 200}',
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '2 minutes'
  );

-- Agriculture Devices (3 devices)
INSERT INTO lorawan_devices (id, dev_eui, name, description, application_id, device_class, activation_mode, status, device_profile_id, last_seen, location, metadata, created_at, updated_at)
VALUES
  (
    '33333333-4444-5555-6666-777777777771',
    '70B3D57ED0050021',
    'Soil Moisture Sensor - Field 1',
    'Capacitive soil moisture and temperature sensor',
    'app-agriculture-01',
    'A',
    'OTAA',
    'online',
    'profile-soil-sensor',
    NOW() - INTERVAL '30 minutes',
    '{"latitude": 38.3001, "longitude": -122.2855, "altitude": 25}',
    '{"type": "soil", "field_id": "FIELD-001", "depth_cm": 30}',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    '33333333-4444-5555-6666-777777777772',
    '70B3D57ED0050022',
    'Weather Station - Vineyard',
    'Multi-sensor weather station (temp, humidity, pressure, wind, rain)',
    'app-agriculture-01',
    'A',
    'OTAA',
    'online',
    'profile-weather-station',
    NOW() - INTERVAL '20 minutes',
    '{"latitude": 38.2985, "longitude": -122.2879, "altitude": 32}',
    '{"type": "weather", "sensors": ["temperature", "humidity", "pressure", "wind_speed", "wind_direction", "rainfall"]}',
    NOW() - INTERVAL '44 days',
    NOW() - INTERVAL '20 minutes'
  ),
  (
    '33333333-4444-5555-6666-777777777773',
    '70B3D57ED0050023',
    'Livestock Tracker - Cattle 01',
    'GPS collar with accelerometer for cattle tracking',
    'app-agriculture-01',
    'A',
    'OTAA',
    'pending',
    'profile-livestock-tracker',
    NOW() - INTERVAL '4 hours',
    '{"latitude": 38.2962, "longitude": -122.2891, "altitude": 28}',
    '{"type": "livestock", "animal": "cattle", "tag_id": "COW-042"}',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '4 hours'
  );

-- Update device counts in applications
UPDATE applications SET device_count = (SELECT COUNT(*) FROM lorawan_devices WHERE application_id = 'app-smartcity-01') WHERE application_id = 'app-smartcity-01';
UPDATE applications SET device_count = (SELECT COUNT(*) FROM lorawan_devices WHERE application_id = 'app-industrial-01') WHERE application_id = 'app-industrial-01';
UPDATE applications SET device_count = (SELECT COUNT(*) FROM lorawan_devices WHERE application_id = 'app-agriculture-01') WHERE application_id = 'app-agriculture-01';
