-- Fix: Allow users to insert their own profile
-- This fixes the infinite recursion issue when creating profiles

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a simple INSERT policy for profiles
-- Users can insert their own profile (checked by auth.uid() = id)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT INSERT ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
