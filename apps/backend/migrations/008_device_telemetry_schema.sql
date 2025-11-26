-- Migration: Device Telemetry Schema
-- Description: Creates universal telemetry tables for time-series data from all device types
-- Supports LoRaWAN, GSM, Wi-Fi, and Bluetooth devices

-- Create device_telemetry table for time-series metrics
CREATE TABLE IF NOT EXISTS device_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL, -- References device tables (lorawan_devices, gsm_devices, wifi_devices, bluetooth_devices)
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('lorawan', 'gsm', 'wifi', 'bluetooth')),
  metric_name VARCHAR(100) NOT NULL, -- e.g., 'temperature', 'humidity', 'signal_strength', 'battery_level'
  metric_value NUMERIC, -- Numeric value for the metric
  metric_unit VARCHAR(20), -- e.g., '°C', '%', 'dBm', 'V'
  metadata JSONB, -- Additional context (e.g., sensor ID, location, quality)
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast time-series queries
CREATE INDEX IF NOT EXISTS idx_device_telemetry_device_id ON device_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_device_type ON device_telemetry(device_type);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_metric_name ON device_telemetry(metric_name);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_timestamp ON device_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_device_metric_time ON device_telemetry(device_id, metric_name, timestamp DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_device_telemetry_lookup ON device_telemetry(device_id, device_type, metric_name, timestamp DESC);

-- Create GIN index on metadata JSONB field
CREATE INDEX IF NOT EXISTS idx_device_telemetry_metadata ON device_telemetry USING GIN (metadata);

-- Create hypertable for better time-series performance (if using TimescaleDB)
-- Uncomment if TimescaleDB extension is available
-- SELECT create_hypertable('device_telemetry', 'timestamp', if_not_exists => TRUE);

-- Add table partitioning by month for better performance (PostgreSQL 11+)
-- This helps with data retention and query performance
-- Note: This is a basic partitioning strategy. Adjust based on data volume.

-- Add comments
COMMENT ON TABLE device_telemetry IS 'Stores time-series telemetry data from all device types';
COMMENT ON COLUMN device_telemetry.device_id IS 'UUID of the device (references device tables)';
COMMENT ON COLUMN device_telemetry.device_type IS 'Type of device: lorawan, gsm, wifi, or bluetooth';
COMMENT ON COLUMN device_telemetry.metric_name IS 'Name of the metric (e.g., temperature, humidity, signal_strength)';
COMMENT ON COLUMN device_telemetry.metric_value IS 'Numeric value of the metric';
COMMENT ON COLUMN device_telemetry.metric_unit IS 'Unit of measurement (e.g., °C, %, dBm, V)';
COMMENT ON COLUMN device_telemetry.metadata IS 'Additional metadata about the measurement';
COMMENT ON COLUMN device_telemetry.timestamp IS 'When the measurement was taken (device time)';
COMMENT ON COLUMN device_telemetry.created_at IS 'When the record was created in the database';

-- Create view for recent telemetry (last 24 hours)
CREATE OR REPLACE VIEW recent_telemetry AS
SELECT
  id,
  device_id,
  device_type,
  metric_name,
  metric_value,
  metric_unit,
  metadata,
  timestamp,
  created_at
FROM device_telemetry
WHERE timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

COMMENT ON VIEW recent_telemetry IS 'Shows telemetry data from the last 24 hours';

-- Create materialized view for aggregated metrics (hourly averages)
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly_avg AS
SELECT
  device_id,
  device_type,
  metric_name,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  COUNT(*) as sample_count,
  metric_unit,
  date_trunc('hour', timestamp) as hour
FROM device_telemetry
GROUP BY device_id, device_type, metric_name, metric_unit, date_trunc('hour', timestamp)
ORDER BY hour DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_telemetry_hourly_avg_lookup
ON telemetry_hourly_avg(device_id, metric_name, hour DESC);

COMMENT ON MATERIALIZED VIEW telemetry_hourly_avg IS 'Aggregated hourly averages of telemetry metrics';

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_telemetry_hourly_avg()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY telemetry_hourly_avg;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a function to clean up old telemetry data
CREATE OR REPLACE FUNCTION cleanup_old_telemetry(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM device_telemetry
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_telemetry IS 'Deletes telemetry data older than specified retention period (default 90 days)';
