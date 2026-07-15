-- Phase 5B: Add Faculty & Department to Waitlist and Profiles
-- This migration adds free-text faculty and department columns to the waitlist
-- and profiles tables, and updates the handle_new_user() trigger to propagate
-- these fields from auth metadata.

-- ============================================================================
-- 1. ALTER TABLES
-- ============================================================================

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS faculty    TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS faculty    TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- ============================================================================
-- 2. INDEXES (for future filtering/search efficiency)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_waitlist_faculty    ON public.waitlist(faculty);
CREATE INDEX IF NOT EXISTS idx_waitlist_department ON public.waitlist(department);
CREATE INDEX IF NOT EXISTS idx_profiles_faculty    ON public.profiles(faculty);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- ============================================================================
-- 3. UPDATE TRIGGER: handle_new_user()
-- Re-defines the trigger to also capture faculty and department from
-- raw_user_meta_data. Mirrors the existing university TEXT pattern.
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
  referrer_user_id  UUID;
BEGIN
  -- Generate a unique 8-character referral code
  new_referral_code := generate_referral_code();
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) LOOP
    new_referral_code := generate_referral_code();
  END LOOP;

  -- Insert into public.profiles (the renamed `users` table)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    university,
    faculty,
    department,
    referral_code,
    referred_by
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'university',
    NEW.raw_user_meta_data->>'faculty',
    NEW.raw_user_meta_data->>'department',
    new_referral_code,
    NEW.raw_user_meta_data->>'ref'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into public.waitlist
  INSERT INTO public.waitlist (
    user_id,
    email,
    full_name,
    university,
    faculty,
    department,
    referral_code,
    referred_by,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'university',
    NEW.raw_user_meta_data->>'faculty',
    NEW.raw_user_meta_data->>'department',
    new_referral_code,
    NEW.raw_user_meta_data->>'ref',
    'verified'
  )
  ON CONFLICT (email) DO NOTHING;

  -- Process referral if applicable
  IF NEW.raw_user_meta_data->>'ref' IS NOT NULL THEN
    SELECT id INTO referrer_user_id
      FROM public.profiles
     WHERE referral_code = NEW.raw_user_meta_data->>'ref';

    IF referrer_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id, status)
      VALUES (referrer_user_id, NEW.id, 'completed')
      ON CONFLICT DO NOTHING;

      UPDATE public.profiles
         SET points = points + 100
       WHERE id = referrer_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (DROP first to ensure the new function body takes effect)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROLLBACK SCRIPT (keep as reference — do not execute in normal flow)
-- ============================================================================
-- ALTER TABLE public.waitlist  DROP COLUMN IF EXISTS faculty;
-- ALTER TABLE public.waitlist  DROP COLUMN IF EXISTS department;
-- ALTER TABLE public.profiles  DROP COLUMN IF EXISTS faculty;
-- ALTER TABLE public.profiles  DROP COLUMN IF EXISTS department;
-- (then restore the previous handle_new_user() function body)
