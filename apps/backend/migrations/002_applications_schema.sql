-- Migration: Applications Schema
-- Description: Creates table for storing LoRaWAN applications
-- This table caches ChirpStack application data locally for faster access

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id VARCHAR(255) UNIQUE NOT NULL, -- ChirpStack application ID
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tenant_id VARCHAR(255),
  device_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on application_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_applications_application_id ON applications(application_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();

-- Add comment to table
COMMENT ON TABLE applications IS 'Stores LoRaWAN applications (cached from ChirpStack)';
COMMENT ON COLUMN applications.application_id IS 'ChirpStack application ID';
COMMENT ON COLUMN applications.device_count IS 'Number of devices in this application';
COMMENT ON COLUMN applications.last_activity IS 'Timestamp of last device activity in this application';
