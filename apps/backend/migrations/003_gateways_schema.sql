-- Migration: Gateways Schema
-- Description: Creates table for storing LoRaWAN gateways
-- This table caches ChirpStack gateway data locally for faster access

-- Create gateways table
CREATE TABLE IF NOT EXISTS gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_eui VARCHAR(16) UNIQUE NOT NULL, -- 16 hex characters (EUI-64)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency_plan VARCHAR(50) NOT NULL, -- EU868, US915, etc.
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMP,
  location JSONB, -- {latitude, longitude, altitude}
  tenant_id VARCHAR(255),
  metadata JSONB, -- Additional gateway metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_gateways_gateway_eui ON gateways(gateway_eui);
CREATE INDEX IF NOT EXISTS idx_gateways_status ON gateways(status);
CREATE INDEX IF NOT EXISTS idx_gateways_frequency_plan ON gateways(frequency_plan);
CREATE INDEX IF NOT EXISTS idx_gateways_last_seen ON gateways(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_gateways_created_at ON gateways(created_at DESC);

-- Create GIN index on location JSONB field for spatial queries
CREATE INDEX IF NOT EXISTS idx_gateways_location ON gateways USING GIN (location);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gateways_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gateways_updated_at
  BEFORE UPDATE ON gateways
  FOR EACH ROW
  EXECUTE FUNCTION update_gateways_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE gateways IS 'Stores LoRaWAN gateways (cached from ChirpStack)';
COMMENT ON COLUMN gateways.gateway_eui IS 'Unique gateway EUI-64 identifier (16 hex characters)';
COMMENT ON COLUMN gateways.frequency_plan IS 'LoRaWAN frequency plan (EU868, US915, AS923, etc.)';
COMMENT ON COLUMN gateways.location IS 'Gateway location as JSON: {latitude, longitude, altitude}';
COMMENT ON COLUMN gateways.last_seen IS 'Timestamp when gateway was last seen online';
