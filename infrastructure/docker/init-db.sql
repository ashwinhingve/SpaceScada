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

-- GSM Messages table (SMS inbox/outbox)
CREATE TABLE IF NOT EXISTS gsm_messages (
    id VARCHAR(100) PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- GSM Locations table (GPS history)
CREATE TABLE IF NOT EXISTS gsm_locations (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    altitude DECIMAL(8, 2),
    speed DECIMAL(6, 2),
    heading DECIMAL(5, 2),
    accuracy DECIMAL(6, 2),
    satellites INTEGER,
    hdop DECIMAL(4, 2),
    fix VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- GSM Network Logs table (signal strength, data usage)
CREATE TABLE IF NOT EXISTS gsm_network_logs (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    operator VARCHAR(100) NOT NULL,
    signal_strength INTEGER NOT NULL,
    signal_quality VARCHAR(20) NOT NULL,
    network_type VARCHAR(20) NOT NULL,
    registered BOOLEAN NOT NULL,
    roaming BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    imei VARCHAR(20) NOT NULL,
    iccid VARCHAR(20) NOT NULL,
    sim_status VARCHAR(20) NOT NULL,
    data_sent_bytes BIGINT DEFAULT 0,
    data_received_bytes BIGINT DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- GSM Commands table (AT command history)
CREATE TABLE IF NOT EXISTS gsm_commands (
    id VARCHAR(100) PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    response TEXT,
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create GSM indexes
CREATE INDEX IF NOT EXISTS idx_gsm_messages_device_id ON gsm_messages(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_messages_timestamp ON gsm_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gsm_messages_direction ON gsm_messages(direction);
CREATE INDEX IF NOT EXISTS idx_gsm_messages_status ON gsm_messages(status);

CREATE INDEX IF NOT EXISTS idx_gsm_locations_device_id ON gsm_locations(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_locations_timestamp ON gsm_locations(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_gsm_network_logs_device_id ON gsm_network_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_network_logs_timestamp ON gsm_network_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_gsm_commands_device_id ON gsm_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_gsm_commands_sent_at ON gsm_commands(sent_at DESC);

-- ESP32 Devices table
CREATE TABLE IF NOT EXISTS esp32_devices (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
    protocol VARCHAR(50) NOT NULL DEFAULT 'MQTT',
    config JSONB NOT NULL,
    sensor_data JSONB,
    control_state JSONB,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ESP32 Sensor Data table (historical data)
CREATE TABLE IF NOT EXISTS esp32_sensor_data (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL REFERENCES esp32_devices(id) ON DELETE CASCADE,
    temperature DECIMAL(6, 2),
    humidity DECIMAL(5, 2),
    pressure DECIMAL(7, 2),
    led_state BOOLEAN,
    custom_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ESP32 Control History table
CREATE TABLE IF NOT EXISTS esp32_control_history (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL REFERENCES esp32_devices(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    command JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create ESP32 indexes
CREATE INDEX IF NOT EXISTS idx_esp32_devices_status ON esp32_devices(status);
CREATE INDEX IF NOT EXISTS idx_esp32_devices_last_seen ON esp32_devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_esp32_sensor_data_device_id ON esp32_sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_esp32_sensor_data_timestamp ON esp32_sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_esp32_control_history_device_id ON esp32_control_history(device_id);
CREATE INDEX IF NOT EXISTS idx_esp32_control_history_sent_at ON esp32_control_history(sent_at DESC);

-- Create triggers for ESP32 devices
CREATE TRIGGER update_esp32_devices_updated_at BEFORE UPDATE ON esp32_devices
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
