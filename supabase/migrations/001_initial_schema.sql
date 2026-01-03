-- ============================================
-- LUME - Initial Database Schema
-- ============================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SOURCE AUDIENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS source_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('facebook', 'instagram')),
  urls TEXT[] NOT NULL DEFAULT '{}',
  selected BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SHARED AUDIENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_audience_id UUID REFERENCES source_audiences(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  contacts JSONB NOT NULL DEFAULT '[]',
  selected BOOLEAN NOT NULL DEFAULT false,
  uploaded_to_meta BOOLEAN NOT NULL DEFAULT false,
  meta_audience_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTACTS TABLE (normalized for better querying)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_audience_id UUID NOT NULL REFERENCES shared_audiences(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  country TEXT,
  interests TEXT[] DEFAULT '{}',
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_contacts_embedding ON contacts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- FILTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_keys JSONB NOT NULL DEFAULT '{}',
  demo_mode BOOLEAN NOT NULL DEFAULT true,
  selected_llm_model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COST TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('supabase', 'openrouter', 'mixedbread', 'apollo', 'hunter')),
  operation TEXT NOT NULL,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster cost queries
CREATE INDEX IF NOT EXISTS idx_cost_tracking_user_service ON cost_tracking(user_id, service);

-- ============================================
-- LOGS TABLE (admin only)
-- ============================================
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for log queries
CREATE INDEX IF NOT EXISTS idx_logs_user_level ON logs(user_id, level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SOURCE AUDIENCES POLICIES
-- ============================================

-- Users can view their own source audiences
CREATE POLICY "Users can view own source audiences"
  ON source_audiences FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own source audiences
CREATE POLICY "Users can insert own source audiences"
  ON source_audiences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own source audiences
CREATE POLICY "Users can update own source audiences"
  ON source_audiences FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own source audiences
CREATE POLICY "Users can delete own source audiences"
  ON source_audiences FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all source audiences
CREATE POLICY "Admins can view all source audiences"
  ON source_audiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SHARED AUDIENCES POLICIES
-- ============================================

-- Users can view their own shared audiences
CREATE POLICY "Users can view own shared audiences"
  ON shared_audiences FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own shared audiences
CREATE POLICY "Users can insert own shared audiences"
  ON shared_audiences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own shared audiences
CREATE POLICY "Users can update own shared audiences"
  ON shared_audiences FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own shared audiences
CREATE POLICY "Users can delete own shared audiences"
  ON shared_audiences FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all shared audiences
CREATE POLICY "Admins can view all shared audiences"
  ON shared_audiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- CONTACTS POLICIES
-- ============================================

-- Users can view contacts from their shared audiences
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_audiences
      WHERE shared_audiences.id = contacts.shared_audience_id
      AND shared_audiences.user_id = auth.uid()
    )
  );

-- Users can insert contacts to their shared audiences
CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_audiences
      WHERE shared_audiences.id = contacts.shared_audience_id
      AND shared_audiences.user_id = auth.uid()
    )
  );

-- ============================================
-- FILTERS POLICIES
-- ============================================

-- Users can view their own filters
CREATE POLICY "Users can view own filters"
  ON filters FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own filters
CREATE POLICY "Users can insert own filters"
  ON filters FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own filters
CREATE POLICY "Users can update own filters"
  ON filters FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own filters
CREATE POLICY "Users can delete own filters"
  ON filters FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- SETTINGS POLICIES
-- ============================================

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- COST TRACKING POLICIES
-- ============================================

-- Users can view their own costs
CREATE POLICY "Users can view own costs"
  ON cost_tracking FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own costs
CREATE POLICY "Users can insert own costs"
  ON cost_tracking FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all costs
CREATE POLICY "Admins can view all costs"
  ON cost_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- LOGS POLICIES
-- ============================================

-- Only admins can view logs
CREATE POLICY "Admins can view all logs"
  ON logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can insert logs
CREATE POLICY "Users can insert logs"
  ON logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only admins can delete logs
CREATE POLICY "Admins can delete logs"
  ON logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_audiences_updated_at
  BEFORE UPDATE ON source_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_audiences_updated_at
  BEFORE UPDATE ON shared_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_filters_updated_at
  BEFORE UPDATE ON filters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate total cost for a user
CREATE OR REPLACE FUNCTION get_user_total_cost(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL;
BEGIN
  SELECT COALESCE(SUM(cost), 0) INTO total_cost
  FROM cost_tracking
  WHERE user_id = user_uuid;
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'totalSourceAudiences', (
      SELECT COUNT(*) FROM source_audiences WHERE user_id = user_uuid
    ),
    'totalUrls', (
      SELECT COALESCE(SUM(array_length(urls, 1)), 0)
      FROM source_audiences
      WHERE user_id = user_uuid
    ),
    'totalContactsFound', (
      SELECT COUNT(*)
      FROM contacts c
      JOIN shared_audiences sa ON c.shared_audience_id = sa.id
      WHERE sa.user_id = user_uuid
    ),
    'totalContactsUploaded', (
      SELECT COUNT(*)
      FROM shared_audiences
      WHERE user_id = user_uuid AND uploaded_to_meta = true
    ),
    'totalCost', COALESCE((
      SELECT SUM(cost) FROM cost_tracking WHERE user_id = user_uuid
    ), 0)
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;
