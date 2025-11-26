-- ============================================
-- Dashboard Widgets Schema
-- ============================================
-- Description: Stores user-customizable dashboard widget layouts and configurations
-- Version: 1.0
-- Author: WebSCADA
-- Created: 2025-11-24

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE widget_type AS ENUM (
  'lorawan_device',
  'gsm_device',
  'wifi_device',
  'bluetooth_device',
  'realtime_chart',
  'gauge',
  'device_list',
  'status_summary',
  'map'
);

CREATE TYPE chart_type AS ENUM (
  'line',
  'area',
  'bar',
  'composed'
);

-- ============================================
-- TABLES
-- ============================================

-- Dashboard Widgets table
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- FK to users table

  -- Widget identification
  widget_key VARCHAR(100) NOT NULL, -- Unique key for this widget instance
  widget_type widget_type NOT NULL,

  -- Layout position (react-grid-layout format)
  layout_x INTEGER NOT NULL DEFAULT 0,
  layout_y INTEGER NOT NULL DEFAULT 0,
  layout_w INTEGER NOT NULL DEFAULT 4, -- Width in grid units
  layout_h INTEGER NOT NULL DEFAULT 4, -- Height in grid units
  layout_min_w INTEGER DEFAULT 2,
  layout_min_h INTEGER DEFAULT 2,
  layout_max_w INTEGER DEFAULT 12,
  layout_max_h INTEGER DEFAULT 12,

  -- Widget configuration
  config JSONB NOT NULL DEFAULT '{}', -- Device-specific configuration

  -- Display settings
  title VARCHAR(255),
  show_header BOOLEAN DEFAULT TRUE,
  refresh_interval INTEGER DEFAULT 5000, -- milliseconds

  -- Conditional visibility
  visible BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint: one widget_key per user
  CONSTRAINT unique_user_widget_key UNIQUE (user_id, widget_key)
);

-- Indexes
CREATE INDEX idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX idx_dashboard_widgets_widget_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_visible ON dashboard_widgets(visible) WHERE visible = TRUE;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_dashboard_widgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dashboard_widgets_updated_at
BEFORE UPDATE ON dashboard_widgets
FOR EACH ROW
EXECUTE FUNCTION update_dashboard_widgets_updated_at();

-- ============================================
-- DEFAULT WIDGET LAYOUTS
-- ============================================
-- Function to create default dashboard for new users
CREATE OR REPLACE FUNCTION create_default_dashboard_widgets(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Status Summary Widget
  INSERT INTO dashboard_widgets (user_id, widget_key, widget_type, layout_x, layout_y, layout_w, layout_h, title, config)
  VALUES (
    p_user_id,
    'status-summary-1',
    'status_summary',
    0, 0, 12, 3,
    'Device Overview',
    '{"showCounts": true, "showCharts": true}'::jsonb
  );

  -- LoRaWAN Devices List
  INSERT INTO dashboard_widgets (user_id, widget_key, widget_type, layout_x, layout_y, layout_w, layout_h, title, config)
  VALUES (
    p_user_id,
    'lorawan-list-1',
    'device_list',
    0, 3, 6, 5,
    'LoRaWAN Devices',
    '{"deviceType": "lorawan", "columns": ["name", "status", "rssi", "snr"], "pageSize": 10}'::jsonb
  );

  -- GSM Devices List
  INSERT INTO dashboard_widgets (user_id, widget_key, widget_type, layout_x, layout_y, layout_w, layout_h, title, config)
  VALUES (
    p_user_id,
    'gsm-list-1',
    'device_list',
    6, 3, 6, 5,
    'GSM Devices',
    '{"deviceType": "gsm", "columns": ["name", "status", "signalStrength", "network"], "pageSize": 10}'::jsonb
  );

  -- Real-time Chart (Temperature)
  INSERT INTO dashboard_widgets (user_id, widget_key, widget_type, layout_x, layout_y, layout_w, layout_h, title, config)
  VALUES (
    p_user_id,
    'chart-temp-1',
    'realtime_chart',
    0, 8, 6, 4,
    'System Temperature',
    '{"dataSource": "temperature", "chartType": "area", "color": "#ef4444", "unit": "°C", "thresholds": {"warning": 30, "critical": 35}}'::jsonb
  );

  -- Gauge Widget
  INSERT INTO dashboard_widgets (user_id, widget_key, widget_type, layout_x, layout_y, layout_w, layout_h, title, config)
  VALUES (
    p_user_id,
    'gauge-pressure-1',
    'gauge',
    6, 8, 3, 4,
    'Pressure',
    '{"dataSource": "pressure", "unit": "bar", "min": 0, "max": 40, "thresholds": [{"value": 28, "color": "#fbbf24"}, {"value": 32, "color": "#ef4444"}]}'::jsonb
  );

  -- Wi-Fi Device Widget
  INSERT INTO dashboard_widgets (user_id, widget_key, widget_type, layout_x, layout_y, layout_w, layout_h, title, config)
  VALUES (
    p_user_id,
    'wifi-device-1',
    'wifi_device',
    9, 8, 3, 4,
    'Wi-Fi Sensor',
    '{"deviceId": null, "showMetrics": ["signalStrength", "bandwidth", "latency"]}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE dashboard_widgets IS 'Stores customizable dashboard widget layouts and configurations for each user';
COMMENT ON COLUMN dashboard_widgets.widget_key IS 'Unique identifier for this widget instance (e.g., lorawan-chart-1)';
COMMENT ON COLUMN dashboard_widgets.widget_type IS 'Type of widget determining the component to render';
COMMENT ON COLUMN dashboard_widgets.layout_x IS 'Horizontal position in grid units';
COMMENT ON COLUMN dashboard_widgets.layout_y IS 'Vertical position in grid units';
COMMENT ON COLUMN dashboard_widgets.layout_w IS 'Width in grid units';
COMMENT ON COLUMN dashboard_widgets.layout_h IS 'Height in grid units';
COMMENT ON COLUMN dashboard_widgets.config IS 'JSON configuration specific to widget type (device IDs, data sources, thresholds, etc.)';
COMMENT ON COLUMN dashboard_widgets.refresh_interval IS 'Auto-refresh interval in milliseconds';
