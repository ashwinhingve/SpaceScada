-- Migration: Device Logs Schema
-- Description: Creates logging tables for device events, errors, and audit trails
-- Supports all device types with structured logging

-- Create device_logs table
CREATE TABLE IF NOT EXISTS device_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL, -- References device tables
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('lorawan', 'gsm', 'wifi', 'bluetooth')),
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  event_type VARCHAR(50) NOT NULL, -- e.g., 'connection', 'disconnection', 'data_received', 'command_sent', 'error'
  message TEXT NOT NULL,
  details JSONB, -- Additional structured data about the event
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient log queries
CREATE INDEX IF NOT EXISTS idx_device_logs_device_id ON device_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_device_type ON device_logs(device_type);
CREATE INDEX IF NOT EXISTS idx_device_logs_log_level ON device_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_device_logs_event_type ON device_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_device_logs_timestamp ON device_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_logs_device_time ON device_logs(device_id, timestamp DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_device_logs_lookup ON device_logs(device_id, device_type, log_level, timestamp DESC);

-- Create GIN index on details JSONB field
CREATE INDEX IF NOT EXISTS idx_device_logs_details ON device_logs USING GIN (details);

-- Create view for error logs
CREATE OR REPLACE VIEW error_logs AS
SELECT
  id,
  device_id,
  device_type,
  log_level,
  event_type,
  message,
  details,
  timestamp,
  created_at
FROM device_logs
WHERE log_level IN ('error', 'critical')
ORDER BY timestamp DESC;

COMMENT ON VIEW error_logs IS 'Shows only error and critical level logs';

-- Create view for recent logs (last 24 hours)
CREATE OR REPLACE VIEW recent_logs AS
SELECT
  id,
  device_id,
  device_type,
  log_level,
  event_type,
  message,
  details,
  timestamp,
  created_at
FROM device_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

COMMENT ON VIEW recent_logs IS 'Shows logs from the last 24 hours';

-- Add comments
COMMENT ON TABLE device_logs IS 'Stores event logs and audit trails for all devices';
COMMENT ON COLUMN device_logs.device_id IS 'UUID of the device (references device tables)';
COMMENT ON COLUMN device_logs.device_type IS 'Type of device: lorawan, gsm, wifi, or bluetooth';
COMMENT ON COLUMN device_logs.log_level IS 'Severity level: debug, info, warning, error, critical';
COMMENT ON COLUMN device_logs.event_type IS 'Type of event (e.g., connection, data_received, error)';
COMMENT ON COLUMN device_logs.message IS 'Human-readable log message';
COMMENT ON COLUMN device_logs.details IS 'Additional structured data about the event';
COMMENT ON COLUMN device_logs.timestamp IS 'When the event occurred (device time)';
COMMENT ON COLUMN device_logs.created_at IS 'When the log was created in the database';

-- Create function to log device events
CREATE OR REPLACE FUNCTION log_device_event(
  p_device_id UUID,
  p_device_type VARCHAR,
  p_log_level VARCHAR,
  p_event_type VARCHAR,
  p_message TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO device_logs (
    device_id,
    device_type,
    log_level,
    event_type,
    message,
    details
  ) VALUES (
    p_device_id,
    p_device_type,
    p_log_level,
    p_event_type,
    p_message,
    p_details
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_device_event IS 'Helper function to create device log entries';

-- Create function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Keep error and critical logs longer (2x retention period)
  DELETE FROM device_logs
  WHERE
    timestamp < NOW() - (retention_days || ' days')::INTERVAL
    AND log_level NOT IN ('error', 'critical');

  -- Delete old error/critical logs after extended period
  DELETE FROM device_logs
  WHERE
    timestamp < NOW() - (retention_days * 2 || ' days')::INTERVAL
    AND log_level IN ('error', 'critical');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_logs IS 'Deletes logs older than retention period (keeps errors longer)';

-- Create table for device configuration history
CREATE TABLE IF NOT EXISTS device_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('lorawan', 'gsm', 'wifi', 'bluetooth')),
  configuration JSONB NOT NULL, -- Full device configuration
  changed_by VARCHAR(255), -- User or system that made the change
  change_reason TEXT, -- Why the configuration was changed
  is_active BOOLEAN DEFAULT TRUE, -- Whether this is the current active config
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for configuration history
CREATE INDEX IF NOT EXISTS idx_device_configurations_device_id ON device_configurations(device_id);
CREATE INDEX IF NOT EXISTS idx_device_configurations_device_type ON device_configurations(device_type);
CREATE INDEX IF NOT EXISTS idx_device_configurations_is_active ON device_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_device_configurations_created_at ON device_configurations(created_at DESC);

-- Create GIN index on configuration JSONB field
CREATE INDEX IF NOT EXISTS idx_device_configurations_config ON device_configurations USING GIN (configuration);

COMMENT ON TABLE device_configurations IS 'Stores device configuration history and audit trail';
COMMENT ON COLUMN device_configurations.configuration IS 'Full device configuration as JSON';
COMMENT ON COLUMN device_configurations.changed_by IS 'User or system that made the change';
COMMENT ON COLUMN device_configurations.is_active IS 'Whether this is the currently active configuration';

-- Create trigger to deactivate old configurations when new one is added
CREATE OR REPLACE FUNCTION deactivate_old_configurations()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new active configuration is inserted, deactivate all others for this device
  IF NEW.is_active = TRUE THEN
    UPDATE device_configurations
    SET is_active = FALSE
    WHERE device_id = NEW.device_id
      AND id != NEW.id
      AND is_active = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deactivate_old_configurations
  AFTER INSERT ON device_configurations
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_old_configurations();
