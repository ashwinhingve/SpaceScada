-- WebSCADA Production Database Schema
-- PostgreSQL 16+
-- IEC 62443 Compliant

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE device_type AS ENUM (
    'GSM_ESP32',
    'LORAWAN',
    'STANDARD_MQTT'
);

CREATE TYPE device_status AS ENUM (
    'ONLINE',
    'OFFLINE',
    'ERROR',
    'PROVISIONING',
    'DECOMMISSIONED'
);

CREATE TYPE connection_status AS ENUM (
    'CONNECTED',
    'DISCONNECTED',
    'CONNECTING',
    'ERROR'
);

CREATE TYPE lorawan_activation AS ENUM (
    'OTAA',
    'ABP'
);

CREATE TYPE alarm_severity AS ENUM (
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW',
    'INFO'
);

CREATE TYPE alarm_status AS ENUM (
    'ACTIVE',
    'ACKNOWLEDGED',
    'RESOLVED',
    'CLEARED'
);

CREATE TYPE command_status AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'EXECUTED',
    'FAILED',
    'TIMEOUT'
);

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'OPERATOR',
    'VIEWER',
    'API_CLIENT'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Base devices table (common fields for all device types)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL, -- User-friendly ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    device_type device_type NOT NULL,
    status device_status NOT NULL DEFAULT 'OFFLINE',

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude DECIMAL(8, 2),
    location_name VARCHAR(255),

    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by UUID,
    updated_by UUID,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    CONSTRAINT devices_device_id_unique UNIQUE (device_id)
);

-- GSM ESP32 specific configuration
CREATE TABLE gsm_devices (
    device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,

    -- Hardware identifiers
    imei VARCHAR(15) UNIQUE NOT NULL,
    iccid VARCHAR(22),
    imsi VARCHAR(15),

    -- Network configuration
    apn VARCHAR(100) NOT NULL,
    apn_username VARCHAR(100),
    apn_password VARCHAR(100), -- Encrypted

    -- MQTT configuration
    mqtt_client_id VARCHAR(255) UNIQUE NOT NULL,
    mqtt_username VARCHAR(255),
    mqtt_password VARCHAR(255), -- Encrypted
    mqtt_broker_host VARCHAR(255) NOT NULL,
    mqtt_broker_port INTEGER NOT NULL DEFAULT 8883,
    mqtt_use_tls BOOLEAN DEFAULT true,
    mqtt_topic_prefix VARCHAR(255) NOT NULL,

    -- GSM modem info
    modem_model VARCHAR(100),
    firmware_version VARCHAR(50),

    -- Signal monitoring
    signal_strength INTEGER, -- RSSI
    signal_quality INTEGER, -- 0-100
    network_type VARCHAR(20), -- 2G/3G/4G
    operator VARCHAR(100),

    -- Power management
    battery_voltage DECIMAL(5, 2),
    battery_percentage INTEGER,
    power_mode VARCHAR(50),

    -- Configuration
    publish_interval INTEGER DEFAULT 60000, -- milliseconds
    heartbeat_interval INTEGER DEFAULT 300000,
    enable_ota BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LoRaWAN specific configuration
CREATE TABLE lorawan_devices (
    device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,

    -- LoRaWAN identifiers
    dev_eui VARCHAR(16) UNIQUE NOT NULL,
    app_eui VARCHAR(16) NOT NULL,
    app_key VARCHAR(32), -- For OTAA, encrypted

    -- Network session (for ABP or after OTAA join)
    dev_addr VARCHAR(8),
    nwk_s_key VARCHAR(32), -- Encrypted
    app_s_key VARCHAR(32), -- Encrypted

    -- Activation
    activation_mode lorawan_activation NOT NULL,
    joined BOOLEAN DEFAULT false,
    join_time TIMESTAMP WITH TIME ZONE,

    -- LoRaWAN parameters
    device_class VARCHAR(1) DEFAULT 'A', -- A, B, or C
    spreading_factor INTEGER DEFAULT 7,
    bandwidth INTEGER DEFAULT 125,
    coding_rate VARCHAR(10) DEFAULT '4/5',
    frequency_plan VARCHAR(50),

    -- ChirpStack integration
    chirpstack_application_id VARCHAR(255) NOT NULL,
    chirpstack_device_profile_id VARCHAR(255),

    -- Payload decoder
    decoder_name VARCHAR(100),
    decoder_script TEXT,

    -- Link quality
    rssi INTEGER,
    snr DECIMAL(5, 2),
    gateway_count INTEGER,

    -- Frame counters
    uplink_frame_count BIGINT DEFAULT 0,
    downlink_frame_count BIGINT DEFAULT 0,

    -- Configuration
    confirmed_uplinks BOOLEAN DEFAULT false,
    rx_delay INTEGER DEFAULT 1,
    rx1_dr_offset INTEGER DEFAULT 0,
    rx2_dr INTEGER DEFAULT 0,
    rx2_frequency BIGINT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_uplink TIMESTAMP WITH TIME ZONE,
    last_downlink TIMESTAMP WITH TIME ZONE
);

-- Standard MQTT devices configuration
CREATE TABLE mqtt_devices (
    device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,

    -- MQTT configuration
    client_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    password VARCHAR(255), -- Encrypted

    -- Connection
    broker_host VARCHAR(255) NOT NULL,
    broker_port INTEGER NOT NULL DEFAULT 1883,
    use_tls BOOLEAN DEFAULT false,
    clean_session BOOLEAN DEFAULT true,
    keep_alive INTEGER DEFAULT 60,

    -- Sparkplug B configuration
    use_sparkplug_b BOOLEAN DEFAULT true,
    group_id VARCHAR(255),
    edge_node_id VARCHAR(255),

    -- Topics
    publish_topics JSONB DEFAULT '[]'::jsonb,
    subscribe_topics JSONB DEFAULT '[]'::jsonb,

    -- QoS settings
    default_qos INTEGER DEFAULT 1,

    -- Last will testament
    lwt_topic VARCHAR(500),
    lwt_payload TEXT,
    lwt_qos INTEGER DEFAULT 1,
    lwt_retain BOOLEAN DEFAULT false,

    -- Client capabilities
    supports_commands BOOLEAN DEFAULT true,
    supports_ota BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device telemetry configuration
CREATE TABLE device_telemetry_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    -- Tag definition
    tag_name VARCHAR(255) NOT NULL,
    tag_alias VARCHAR(255),
    data_type VARCHAR(50) NOT NULL, -- Float, Integer, Boolean, String, JSON
    unit VARCHAR(50),

    -- Measurement
    measurement_name VARCHAR(255) NOT NULL, -- InfluxDB measurement
    field_name VARCHAR(255) NOT NULL, -- InfluxDB field

    -- Validation
    min_value DECIMAL(20, 6),
    max_value DECIMAL(20, 6),
    enum_values JSONB,

    -- Scaling
    scale_factor DECIMAL(10, 6) DEFAULT 1.0,
    offset DECIMAL(10, 6) DEFAULT 0.0,

    -- Alarming
    enable_alarms BOOLEAN DEFAULT false,
    alarm_high_high DECIMAL(20, 6),
    alarm_high DECIMAL(20, 6),
    alarm_low DECIMAL(20, 6),
    alarm_low_low DECIMAL(20, 6),
    alarm_deadband DECIMAL(20, 6),

    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT device_telemetry_config_unique UNIQUE (device_id, tag_name)
);

-- ============================================
-- CONNECTION & ACTIVITY TABLES
-- ============================================

-- Device connection history
CREATE TABLE device_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    -- Connection details
    connection_status connection_status NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Network info
    ip_address INET,
    port INTEGER,
    protocol VARCHAR(50),

    -- Disconnect reason
    disconnect_reason VARCHAR(255),
    disconnect_code INTEGER,

    -- Session info
    session_id VARCHAR(255),
    bytes_sent BIGINT DEFAULT 0,
    bytes_received BIGINT DEFAULT 0,
    messages_sent BIGINT DEFAULT 0,
    messages_received BIGINT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device commands (downlink)
CREATE TABLE device_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    -- Command details
    command_type VARCHAR(100) NOT NULL,
    command_payload JSONB NOT NULL,

    -- Status
    status command_status NOT NULL DEFAULT 'PENDING',

    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    timeout_at TIMESTAMP WITH TIME ZONE,

    -- Response
    response_payload JSONB,
    error_message TEXT,

    -- Metadata
    priority INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_by UUID,

    -- Audit
    audit_log JSONB DEFAULT '[]'::jsonb
);

-- Device locations (GPS tracking)
CREATE TABLE device_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    -- Location
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(8, 2),

    -- Accuracy
    accuracy DECIMAL(8, 2),
    satellites INTEGER,
    hdop DECIMAL(5, 2),

    -- Movement
    speed DECIMAL(8, 2), -- km/h
    heading DECIMAL(5, 2), -- degrees

    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ALARM TABLES
-- ============================================

-- Alarm definitions
CREATE TABLE alarm_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,

    -- Alarm configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,
    severity alarm_severity NOT NULL,

    -- Condition
    tag_name VARCHAR(255),
    condition_type VARCHAR(50) NOT NULL, -- HighHigh, High, Low, LowLow, DeviceOffline, etc.
    threshold_value DECIMAL(20, 6),
    deadband DECIMAL(20, 6),

    -- Condition expression (for complex alarms)
    condition_expression TEXT,

    -- Behavior
    enabled BOOLEAN DEFAULT true,
    require_acknowledgment BOOLEAN DEFAULT true,
    auto_clear BOOLEAN DEFAULT true,

    -- Notifications
    notification_channels JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Active alarms
CREATE TABLE alarms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alarm_definition_id UUID REFERENCES alarm_definitions(id),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    -- Alarm details
    severity alarm_severity NOT NULL,
    status alarm_status NOT NULL DEFAULT 'ACTIVE',
    message TEXT NOT NULL,

    -- Values
    tag_name VARCHAR(255),
    current_value DECIMAL(20, 6),
    threshold_value DECIMAL(20, 6),

    -- Timing
    activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    cleared_at TIMESTAMP WITH TIME ZONE,

    -- Acknowledgment
    acknowledged_by UUID,
    acknowledgment_note TEXT,

    -- Resolution
    resolution_note TEXT,
    resolved_by UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Notification tracking
    notifications_sent JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USER & AUTHENTICATION TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),

    -- Role & permissions
    role user_role NOT NULL DEFAULT 'VIEWER',
    permissions JSONB DEFAULT '[]'::jsonb,

    -- Status
    active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,

    -- MFA
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255), -- Encrypted

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE,

    -- Account management
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE
);

-- API Keys (for programmatic access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Key details
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- For identification without revealing full key

    -- Scope
    scopes JSONB DEFAULT '[]'::jsonb,
    device_ids JSONB DEFAULT '[]'::jsonb, -- Empty = all devices

    -- Status
    active BOOLEAN DEFAULT true,

    -- Rate limiting
    rate_limit INTEGER, -- requests per minute

    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Usage tracking
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count BIGINT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Actor
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,

    -- Action
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,

    -- Details
    old_values JSONB,
    new_values JSONB,
    success BOOLEAN NOT NULL,
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Devices
CREATE INDEX idx_devices_device_type ON devices(device_type);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_last_seen ON devices(last_seen DESC);
CREATE INDEX idx_devices_location ON devices(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_devices_tags ON devices USING GIN(tags);
CREATE INDEX idx_devices_metadata ON devices USING GIN(metadata);

-- GSM Devices
CREATE INDEX idx_gsm_devices_imei ON gsm_devices(imei);
CREATE INDEX idx_gsm_devices_mqtt_client_id ON gsm_devices(mqtt_client_id);
CREATE INDEX idx_gsm_devices_signal_strength ON gsm_devices(signal_strength);

-- LoRaWAN Devices
CREATE INDEX idx_lorawan_devices_dev_eui ON lorawan_devices(dev_eui);
CREATE INDEX idx_lorawan_devices_app_eui ON lorawan_devices(app_eui);
CREATE INDEX idx_lorawan_devices_chirpstack_app ON lorawan_devices(chirpstack_application_id);
CREATE INDEX idx_lorawan_devices_joined ON lorawan_devices(joined);
CREATE INDEX idx_lorawan_devices_last_uplink ON lorawan_devices(last_uplink DESC);

-- MQTT Devices
CREATE INDEX idx_mqtt_devices_client_id ON mqtt_devices(client_id);
CREATE INDEX idx_mqtt_devices_group_edge ON mqtt_devices(group_id, edge_node_id);

-- Telemetry Config
CREATE INDEX idx_telemetry_config_device_id ON device_telemetry_config(device_id);
CREATE INDEX idx_telemetry_config_tag_name ON device_telemetry_config(tag_name);
CREATE INDEX idx_telemetry_config_measurement ON device_telemetry_config(measurement_name);

-- Connections
CREATE INDEX idx_device_connections_device_id ON device_connections(device_id);
CREATE INDEX idx_device_connections_created_at ON device_connections(created_at DESC);
CREATE INDEX idx_device_connections_status ON device_connections(connection_status);

-- Commands
CREATE INDEX idx_device_commands_device_id ON device_commands(device_id);
CREATE INDEX idx_device_commands_status ON device_commands(status);
CREATE INDEX idx_device_commands_created_at ON device_commands(created_at DESC);
CREATE INDEX idx_device_commands_timeout ON device_commands(timeout_at) WHERE status IN ('PENDING', 'SENT');

-- Locations
CREATE INDEX idx_device_locations_device_id ON device_locations(device_id);
CREATE INDEX idx_device_locations_timestamp ON device_locations(timestamp DESC);
CREATE INDEX idx_device_locations_coords ON device_locations(latitude, longitude);

-- Alarms
CREATE INDEX idx_alarm_definitions_device_id ON alarm_definitions(device_id);
CREATE INDEX idx_alarm_definitions_enabled ON alarm_definitions(enabled);
CREATE INDEX idx_alarms_device_id ON alarms(device_id);
CREATE INDEX idx_alarms_status ON alarms(status);
CREATE INDEX idx_alarms_severity ON alarms(severity);
CREATE INDEX idx_alarms_activated_at ON alarms(activated_at DESC);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- API Keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);

-- Audit Log
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gsm_devices_updated_at BEFORE UPDATE ON gsm_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lorawan_devices_updated_at BEFORE UPDATE ON lorawan_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mqtt_devices_updated_at BEFORE UPDATE ON mqtt_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_telemetry_config_updated_at BEFORE UPDATE ON device_telemetry_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alarm_definitions_updated_at BEFORE UPDATE ON alarm_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (IEC 62443 Compliance)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_isolation_policy ON users
    FOR ALL
    USING (id = current_setting('app.current_user_id', TRUE)::uuid);

-- API keys isolation
CREATE POLICY api_keys_isolation_policy ON api_keys
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', TRUE)::uuid);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get device statistics
CREATE OR REPLACE FUNCTION get_device_statistics()
RETURNS TABLE (
    device_type device_type,
    status device_status,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.device_type, d.status, COUNT(*)
    FROM devices d
    WHERE d.deleted_at IS NULL
    GROUP BY d.device_type, d.status;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_log
    WHERE timestamp < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get active alarms count
CREATE OR REPLACE FUNCTION get_active_alarms_count()
RETURNS TABLE (
    severity alarm_severity,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT a.severity, COUNT(*)
    FROM alarms a
    WHERE a.status = 'ACTIVE'
    GROUP BY a.severity;
END;
$$ LANGUAGE plpgsql;
