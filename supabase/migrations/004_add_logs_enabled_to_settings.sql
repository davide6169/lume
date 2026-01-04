-- ============================================
-- Add logs_enabled and selected_embedding_model to settings
-- ============================================

-- Add logs_enabled column (default to true for existing users)
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS logs_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add selected_embedding_model column
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS selected_embedding_model TEXT;
