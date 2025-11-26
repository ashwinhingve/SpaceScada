-- Migration: Bluetooth Devices Schema
-- Description: Creates table for storing Bluetooth and BLE devices
-- Supports BLE (Bluetooth Low Energy) and Classic Bluetooth devices

-- Create bluetooth_devices table
CREATE TABLE IF NOT EXISTS bluetooth_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mac_address VARCHAR(17) UNIQUE NOT NULL, -- Format: AA:BB:CC:DD:EE:FF
  application_id VARCHAR(255) NOT NULL, -- References applications table
  description TEXT,
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  protocol VARCHAR(20) DEFAULT 'BLE' CHECK (protocol IN ('BLE', 'Classic')),
  signal_strength INTEGER CHECK (signal_strength >= 0 AND signal_strength <= 100), -- 0-100% (RSSI mapped)
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100), -- 0-100%
  firmware_version VARCHAR(50),
  hardware_version VARCHAR(50),
  manufacturer VARCHAR(100),
  last_seen TIMESTAMP,
  location JSONB, -- {latitude, longitude, altitude}
  metadata JSONB, -- Additional device metadata (services, characteristics, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_mac_address ON bluetooth_devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_application_id ON bluetooth_devices(application_id);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_status ON bluetooth_devices(status);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_protocol ON bluetooth_devices(protocol);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_signal_strength ON bluetooth_devices(signal_strength);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_battery_level ON bluetooth_devices(battery_level);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_manufacturer ON bluetooth_devices(manufacturer);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_last_seen ON bluetooth_devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_created_at ON bluetooth_devices(created_at DESC);

-- Create GIN index on location JSONB field for spatial queries
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_location ON bluetooth_devices USING GIN (location);

-- Create GIN index on metadata JSONB field for service/characteristic queries
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_metadata ON bluetooth_devices USING GIN (metadata);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bluetooth_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bluetooth_devices_updated_at
  BEFORE UPDATE ON bluetooth_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_bluetooth_devices_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE bluetooth_devices IS 'Stores Bluetooth and BLE IoT devices (beacons, sensors, etc.)';
COMMENT ON COLUMN bluetooth_devices.mac_address IS 'Unique Bluetooth MAC address in format AA:BB:CC:DD:EE:FF';
COMMENT ON COLUMN bluetooth_devices.protocol IS 'Bluetooth protocol: BLE (Bluetooth Low Energy) or Classic';
COMMENT ON COLUMN bluetooth_devices.signal_strength IS 'Bluetooth signal strength percentage (0-100), mapped from RSSI';
COMMENT ON COLUMN bluetooth_devices.battery_level IS 'Device battery level percentage (0-100)';
COMMENT ON COLUMN bluetooth_devices.location IS 'Device location as JSON: {latitude, longitude, altitude}';
COMMENT ON COLUMN bluetooth_devices.metadata IS 'Additional metadata: GATT services, characteristics, UUID, etc.';
COMMENT ON COLUMN bluetooth_devices.last_seen IS 'Timestamp when device was last seen/detected';
