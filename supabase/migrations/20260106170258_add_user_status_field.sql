-- ============================================
-- Add User Status Field for Approval System
-- ============================================

-- Add status column to profiles table
ALTER TABLE profiles
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved'));

-- Update existing profiles to be approved
UPDATE profiles SET status = 'approved' WHERE status = 'pending';

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with approval system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_status TEXT;
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.profiles;

  -- First user becomes admin and approved, all others are regular users pending approval
  IF user_count = 0 THEN
    user_role := 'admin';
    user_status := 'approved';
  ELSE
    user_role := 'user';
    user_status := 'pending';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role,
    user_status
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON COLUMN profiles.status IS 'Account approval status: pending (awaiting admin approval) or approved (can access the system)';
