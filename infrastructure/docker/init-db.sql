-- WebSCADA Database Initialization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
    protocol VARCHAR(50) NOT NULL,
    connection_config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    unit VARCHAR(50),
    scaling_factor DECIMAL,
    alarm_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tag values table (for historical data)
CREATE TABLE IF NOT EXISTS tag_values (
    id BIGSERIAL PRIMARY KEY,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    quality VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alarms table
CREATE TABLE IF NOT EXISTS alarms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    value JSONB,
    threshold DECIMAL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tags_device_id ON tags(device_id);
CREATE INDEX IF NOT EXISTS idx_tag_values_tag_id ON tag_values(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_values_timestamp ON tag_values(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alarms_tag_id ON alarms(tag_id);
CREATE INDEX IF NOT EXISTS idx_alarms_device_id ON alarms(device_id);
CREATE INDEX IF NOT EXISTS idx_alarms_acknowledged ON alarms(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alarms_timestamp ON alarms(timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - change in production!)
INSERT INTO users (username, email, password_hash, role, permissions)
VALUES (
    'admin',
    'admin@webscada.local',
    '$2b$10$rBV2kVx8z1qPf6FqGZXwYeTXJKGdXqK8YmQvJZvJ8YvGxQxZqGqVG',
    'ADMIN',
    '["READ_DEVICES", "WRITE_DEVICES", "READ_TAGS", "WRITE_TAGS", "ACKNOWLEDGE_ALARMS", "MANAGE_USERS", "SYSTEM_CONFIG"]'::jsonb
) ON CONFLICT DO NOTHING;
