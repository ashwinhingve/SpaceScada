-- Migration: LoRaWAN End Devices Schema
-- Description: Creates table for storing LoRaWAN end devices
-- This table caches ChirpStack device data locally for faster access

-- Create lorawan_devices table
CREATE TABLE IF NOT EXISTS lorawan_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dev_eui VARCHAR(16) UNIQUE NOT NULL, -- 16 hex characters (EUI-64)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  application_id VARCHAR(255) NOT NULL, -- References applications table
  device_class CHAR(1) DEFAULT 'A' CHECK (device_class IN ('A', 'B', 'C')),
  activation_mode VARCHAR(10) DEFAULT 'OTAA' CHECK (activation_mode IN ('OTAA', 'ABP')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('online', 'offline', 'pending', 'error')),
  device_profile_id VARCHAR(255),
  last_seen TIMESTAMP,
  location JSONB, -- {latitude, longitude, altitude}
  metadata JSONB, -- Additional device metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_dev_eui ON lorawan_devices(dev_eui);
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_application_id ON lorawan_devices(application_id);
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_status ON lorawan_devices(status);
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_device_class ON lorawan_devices(device_class);
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_activation_mode ON lorawan_devices(activation_mode);
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_last_seen ON lorawan_devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_created_at ON lorawan_devices(created_at DESC);

-- Create GIN index on location JSONB field for spatial queries
CREATE INDEX IF NOT EXISTS idx_lorawan_devices_location ON lorawan_devices USING GIN (location);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lorawan_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lorawan_devices_updated_at
  BEFORE UPDATE ON lorawan_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_lorawan_devices_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE lorawan_devices IS 'Stores LoRaWAN end devices (cached from ChirpStack)';
COMMENT ON COLUMN lorawan_devices.dev_eui IS 'Unique device EUI-64 identifier (16 hex characters)';
COMMENT ON COLUMN lorawan_devices.device_class IS 'LoRaWAN device class: A (battery), B (beacon), or C (continuous)';
COMMENT ON COLUMN lorawan_devices.activation_mode IS 'Device activation mode: OTAA (Over-The-Air) or ABP (Activation By Personalization)';
COMMENT ON COLUMN lorawan_devices.location IS 'Device location as JSON: {latitude, longitude, altitude}';
COMMENT ON COLUMN lorawan_devices.last_seen IS 'Timestamp when device last sent uplink';
