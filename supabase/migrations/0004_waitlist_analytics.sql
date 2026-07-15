-- Phase 6: Waitlist Analytics & Extra Fields
-- Adds phone, graduation_year, newsletter_consent, terms_accepted_at to waitlist and profiles.
-- Adds referral_clicks to profiles.
-- Updates handle_new_user() to capture these fields.

-- ============================================================================
-- 1. ALTER TABLES
-- ============================================================================

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year SMALLINT,
  ADD COLUMN IF NOT EXISTS newsletter_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year SMALLINT,
  ADD COLUMN IF NOT EXISTS newsletter_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS referral_clicks INTEGER DEFAULT 0;

-- ============================================================================
-- 2. UPDATE TRIGGER: handle_new_user()
-- Re-defines the trigger to capture new analytics and optional fields
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
    phone,
    graduation_year,
    newsletter_consent,
    terms_accepted_at,
    referral_code,
    referred_by
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'university',
    NEW.raw_user_meta_data->>'faculty',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'graduation_year')::SMALLINT,
    COALESCE((NEW.raw_user_meta_data->>'newsletter_consent')::BOOLEAN, FALSE),
    (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMP WITH TIME ZONE,
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
    phone,
    graduation_year,
    newsletter_consent,
    terms_accepted_at,
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
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'graduation_year')::SMALLINT,
    COALESCE((NEW.raw_user_meta_data->>'newsletter_consent')::BOOLEAN, FALSE),
    (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMP WITH TIME ZONE,
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
