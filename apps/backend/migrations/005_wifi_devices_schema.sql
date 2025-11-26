-- Migration: Wi-Fi Devices Schema
-- Description: Creates table for storing Wi-Fi enabled IoT devices
-- Supports ESP32, ESP8266, ESP32-C3 and other Wi-Fi chipsets

-- Create wifi_devices table
CREATE TABLE IF NOT EXISTS wifi_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mac_address VARCHAR(17) UNIQUE NOT NULL, -- Format: AA:BB:CC:DD:EE:FF
  application_id VARCHAR(255) NOT NULL, -- References applications table
  description TEXT,
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  ssid VARCHAR(255), -- Connected Wi-Fi network SSID
  signal_strength INTEGER CHECK (signal_strength >= 0 AND signal_strength <= 100), -- 0-100%
  ip_address VARCHAR(45), -- IPv4 or IPv6
  chipset VARCHAR(50), -- ESP32, ESP8266, ESP32-C3, etc.
  firmware_version VARCHAR(50),
  last_seen TIMESTAMP,
  location JSONB, -- {latitude, longitude, altitude}
  metadata JSONB, -- Additional device metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_wifi_devices_mac_address ON wifi_devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_application_id ON wifi_devices(application_id);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_status ON wifi_devices(status);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_ssid ON wifi_devices(ssid);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_chipset ON wifi_devices(chipset);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_signal_strength ON wifi_devices(signal_strength);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_last_seen ON wifi_devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_wifi_devices_created_at ON wifi_devices(created_at DESC);

-- Create GIN index on location JSONB field for spatial queries
CREATE INDEX IF NOT EXISTS idx_wifi_devices_location ON wifi_devices USING GIN (location);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wifi_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wifi_devices_updated_at
  BEFORE UPDATE ON wifi_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_wifi_devices_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE wifi_devices IS 'Stores Wi-Fi enabled IoT devices (ESP32, ESP8266, etc.)';
COMMENT ON COLUMN wifi_devices.mac_address IS 'Unique Wi-Fi MAC address in format AA:BB:CC:DD:EE:FF';
COMMENT ON COLUMN wifi_devices.ssid IS 'Wi-Fi network SSID the device is connected to';
COMMENT ON COLUMN wifi_devices.signal_strength IS 'Wi-Fi signal strength percentage (0-100)';
COMMENT ON COLUMN wifi_devices.chipset IS 'Wi-Fi chipset type (ESP32, ESP8266, ESP32-C3, etc.)';
COMMENT ON COLUMN wifi_devices.location IS 'Device location as JSON: {latitude, longitude, altitude}';
COMMENT ON COLUMN wifi_devices.last_seen IS 'Timestamp when device was last seen online';
