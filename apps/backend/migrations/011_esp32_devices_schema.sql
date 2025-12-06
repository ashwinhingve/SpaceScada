-- Migration: ESP32 Devices Schema
-- Description: Creates tables for storing ESP32 devices and sensor data

-- Create esp32_devices table
CREATE TABLE IF NOT EXISTS esp32_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  protocol VARCHAR(50),
  config JSONB,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_esp32_devices_status ON esp32_devices(status);
CREATE INDEX IF NOT EXISTS idx_esp32_devices_type ON esp32_devices(type);
CREATE INDEX IF NOT EXISTS idx_esp32_devices_last_seen ON esp32_devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_esp32_devices_created_at ON esp32_devices(created_at DESC);

-- Create GIN index on config JSONB field
CREATE INDEX IF NOT EXISTS idx_esp32_devices_config ON esp32_devices USING GIN (config);

-- Create esp32_sensor_data table
CREATE TABLE IF NOT EXISTS esp32_sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  temperature NUMERIC(5, 2),
  humidity NUMERIC(5, 2),
  pressure NUMERIC(7, 2),
  led_state BOOLEAN,
  custom_data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for sensor data
CREATE INDEX IF NOT EXISTS idx_esp32_sensor_data_device_id ON esp32_sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_esp32_sensor_data_timestamp ON esp32_sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_esp32_sensor_data_device_timestamp ON esp32_sensor_data(device_id, timestamp DESC);

-- Create GIN index on custom_data JSONB field
CREATE INDEX IF NOT EXISTS idx_esp32_sensor_data_custom_data ON esp32_sensor_data USING GIN (custom_data);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_esp32_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_esp32_devices_updated_at ON esp32_devices;
CREATE TRIGGER trigger_update_esp32_devices_updated_at
  BEFORE UPDATE ON esp32_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_esp32_devices_updated_at();

-- Add comments to tables and columns
COMMENT ON TABLE esp32_devices IS 'Stores ESP32 IoT devices';
COMMENT ON COLUMN esp32_devices.config IS 'Device configuration as JSON';
COMMENT ON COLUMN esp32_devices.last_seen IS 'Timestamp when device was last seen online';
COMMENT ON TABLE esp32_sensor_data IS 'Stores sensor data from ESP32 devices';
COMMENT ON COLUMN esp32_sensor_data.custom_data IS 'Additional custom sensor data as JSON';
