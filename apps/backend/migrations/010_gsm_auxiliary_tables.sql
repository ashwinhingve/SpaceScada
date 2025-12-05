-- Migration: GSM Auxiliary Tables
-- Description: Creates auxiliary tables for GSM device operations
-- Tables: gsm_messages, gsm_locations, gsm_network_logs, gsm_commands

-- ============================================
-- GSM MESSAGES TABLE (SMS)
-- ============================================

CREATE TABLE IF NOT EXISTS gsm_messages (
  id VARCHAR(255) PRIMARY KEY,
  device_id UUID NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_gsm_messages_device_id ON gsm_messages(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_messages_timestamp ON gsm_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gsm_messages_direction ON gsm_messages(direction);
CREATE INDEX IF NOT EXISTS idx_gsm_messages_status ON gsm_messages(status);
CREATE INDEX IF NOT EXISTS idx_gsm_messages_phone_number ON gsm_messages(phone_number);

COMMENT ON TABLE gsm_messages IS 'Stores SMS messages sent and received by GSM devices';
COMMENT ON COLUMN gsm_messages.direction IS 'Message direction: INBOUND or OUTBOUND';
COMMENT ON COLUMN gsm_messages.status IS 'Message status: PENDING, SENT, DELIVERED, FAILED, RECEIVED';

-- ============================================
-- GSM LOCATIONS TABLE (GPS Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS gsm_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  altitude DECIMAL(8, 2),
  speed DECIMAL(8, 2), -- km/h
  heading DECIMAL(5, 2), -- degrees (0-360)
  accuracy DECIMAL(8, 2), -- meters
  satellites INTEGER,
  hdop DECIMAL(5, 2), -- Horizontal Dilution of Precision
  fix VARCHAR(20), -- NO_FIX, 2D, 3D, DGPS
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_gsm_locations_device_id ON gsm_locations(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_locations_timestamp ON gsm_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gsm_locations_device_time ON gsm_locations(device_id, timestamp DESC);

-- Create GIS index for spatial queries (if PostGIS is available)
-- CREATE INDEX IF NOT EXISTS idx_gsm_locations_coords ON gsm_locations USING GIST (ll_to_earth(latitude, longitude));

COMMENT ON TABLE gsm_locations IS 'Stores GPS location history for GSM devices';
COMMENT ON COLUMN gsm_locations.fix IS 'GPS fix type: NO_FIX, 2D, 3D, DGPS';
COMMENT ON COLUMN gsm_locations.hdop IS 'Horizontal Dilution of Precision (lower is better)';

-- ============================================
-- GSM NETWORK LOGS TABLE (Network Status)
-- ============================================

CREATE TABLE IF NOT EXISTS gsm_network_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  operator VARCHAR(100),
  signal_strength INTEGER, -- RSSI (0-31 or dBm)
  signal_quality INTEGER, -- 0-100%
  network_type VARCHAR(20), -- 2G, 3G, 4G, LTE, 5G
  registered BOOLEAN,
  roaming BOOLEAN,
  ip_address VARCHAR(45), -- IPv4 or IPv6
  imei VARCHAR(15),
  iccid VARCHAR(22),
  sim_status VARCHAR(50), -- READY, SIM_PIN, SIM_PUK, SIM_FAILURE, NOT_INSERTED
  data_sent_bytes BIGINT DEFAULT 0,
  data_received_bytes BIGINT DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_gsm_network_logs_device_id ON gsm_network_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_network_logs_timestamp ON gsm_network_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gsm_network_logs_device_time ON gsm_network_logs(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gsm_network_logs_operator ON gsm_network_logs(operator);
CREATE INDEX IF NOT EXISTS idx_gsm_network_logs_network_type ON gsm_network_logs(network_type);

COMMENT ON TABLE gsm_network_logs IS 'Stores network status history for GSM devices';
COMMENT ON COLUMN gsm_network_logs.signal_strength IS 'RSSI value (0-31) or dBm';
COMMENT ON COLUMN gsm_network_logs.signal_quality IS 'Signal quality percentage (0-100)';
COMMENT ON COLUMN gsm_network_logs.network_type IS 'Network technology: 2G, 3G, 4G, LTE, 5G';

-- ============================================
-- GSM COMMANDS TABLE (AT Commands)
-- ============================================

CREATE TABLE IF NOT EXISTS gsm_commands (
  id VARCHAR(255) PRIMARY KEY,
  device_id UUID NOT NULL,
  command VARCHAR(255) NOT NULL,
  response TEXT,
  status VARCHAR(20), -- PENDING, SUCCESS, FAILED, TIMEOUT
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_gsm_commands_device_id ON gsm_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_commands_sent_at ON gsm_commands(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_gsm_commands_status ON gsm_commands(status);
CREATE INDEX IF NOT EXISTS idx_gsm_commands_device_sent ON gsm_commands(device_id, sent_at DESC);

COMMENT ON TABLE gsm_commands IS 'Stores AT command history for GSM devices';
COMMENT ON COLUMN gsm_commands.command IS 'AT command sent to the modem';
COMMENT ON COLUMN gsm_commands.status IS 'Command execution status: PENDING, SUCCESS, FAILED, TIMEOUT';

-- ============================================
-- CLEANUP FUNCTIONS (Optional - for data retention)
-- ============================================

-- Function to clean up old location data (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_gsm_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM gsm_locations
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old network logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_gsm_network_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM gsm_network_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old commands (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_gsm_commands()
RETURNS void AS $$
BEGIN
  DELETE FROM gsm_commands
  WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_gsm_locations() IS 'Removes GPS location data older than 30 days';
COMMENT ON FUNCTION cleanup_old_gsm_network_logs() IS 'Removes network logs older than 30 days';
COMMENT ON FUNCTION cleanup_old_gsm_commands() IS 'Removes command history older than 90 days';
