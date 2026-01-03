-- Add source_audience_type column to shared_audiences
-- This will be populated automatically when creating shared audiences

ALTER TABLE shared_audiences
ADD COLUMN source_audience_type TEXT NOT NULL DEFAULT 'facebook'
CHECK (source_audience_type IN ('facebook', 'instagram'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_shared_audiences_source_type
ON shared_audiences(source_audience_type);
