-- Migration: 0007_production_fixes.sql
-- Description: Comprehensive production fixes identified in the pre-launch audit.
--
-- Fixes applied:
--   1. handle_new_user() — populate ALL columns in profiles and waitlist
--   2. Recreate is_admin() to query profiles (not the old deleted users table)
--   3. Fix AuthCallback welcome email duplicate sending (DB-side guard via profiles.created_at)

-- ============================================================================
-- 1. FIX is_admin() — was querying the deleted public.users table
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
      AND deleted_at IS NULL
  );
END;
$$;

-- ============================================================================
-- 2. FIX handle_new_user() — populate ALL columns correctly
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
  code_exists       BOOLEAN;
  referrer_user_id  UUID;
BEGIN
  -- ── Step 1: Generate a collision-resistant unique referral code ─────────────
  LOOP
    new_referral_code := public.generate_referral_code();
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    ) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- ── Step 2: Insert into public.profiles with ALL available metadata ─────────
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    university,
    avatar_url,
    faculty,
    department,
    phone,
    graduation_year,
    newsletter_consent,
    terms_accepted_at,
    referral_code,
    referred_by
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'university', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'faculty', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'graduation_year', '')::SMALLINT,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'newsletter_consent', '')::BOOLEAN, FALSE),
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::TIMESTAMPTZ,
    new_referral_code,
    NULLIF(NEW.raw_user_meta_data->>'ref', '')
  );

  -- ── Step 3: Process referral if a valid, non-self referral code was supplied ─
  IF NULLIF(NEW.raw_user_meta_data->>'ref', '') IS NOT NULL THEN
    SELECT id INTO referrer_user_id
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'ref'
      AND deleted_at IS NULL
    LIMIT 1;

    IF referrer_user_id IS NOT NULL THEN
      IF referrer_user_id = NEW.id THEN
        -- Self-referral fraud log
        INSERT INTO public.fraud_logs (user_id, reason, metadata)
        VALUES (
          NEW.id,
          'self_referral_attempt',
          jsonb_build_object('ref_code', NEW.raw_user_meta_data->>'ref')
        );
      ELSE
        -- Valid referral — record it and award points atomically
        INSERT INTO public.referrals (referrer_id, referred_id, status)
        VALUES (referrer_user_id, NEW.id, 'completed')
        ON CONFLICT DO NOTHING;

        UPDATE public.profiles
           SET points = points + 100
         WHERE id = referrer_user_id;
      END IF;
    END IF;
  END IF;

  -- ── Step 4: Insert into public.waitlist with ALL required columns ───────────
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
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'university', ''),
    NULLIF(NEW.raw_user_meta_data->>'faculty', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'graduation_year', '')::SMALLINT,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'newsletter_consent', '')::BOOLEAN, FALSE),
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::TIMESTAMPTZ,
    new_referral_code,
    NULLIF(NEW.raw_user_meta_data->>'ref', ''),
    'verified'::waitlist_status
  )
  ON CONFLICT (email) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. Ensure trigger is bound to the correct function
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. Add missing INSERT policy on waitlist (for future direct-insert scenarios)
-- ============================================================================

DROP POLICY IF EXISTS "Service can insert waitlist entries" ON public.waitlist;
CREATE POLICY "Service can insert waitlist entries"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 5. Add welcome_email_sent column to profiles to prevent duplicate emails
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;
