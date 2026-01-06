-- ============================================
-- Make first user automatically admin
-- ============================================

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with automatic admin assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First user becomes admin, all others are regular users
  user_role := CASE
    WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
    ELSE 'user'
  END;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
