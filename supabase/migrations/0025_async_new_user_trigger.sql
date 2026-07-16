-- Migration: 0025_async_new_user_trigger.sql
-- Description: Simplifies handle_new_user trigger to only handle critical profiles/roles
-- and defers waitlist and referrals to asynchronous Edge Function webhooks.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_referral_code TEXT;
  code_exists       BOOLEAN;
  assigned_role     public.user_role;
  granular_role_name TEXT;
  granular_role_id  UUID;
BEGIN
  -- ── Step 1: Generate a collision-resistant unique referral code ─────────────
  LOOP
    new_referral_code := public.generate_referral_code();
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    ) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- ── Step 2: Determine role from user_metadata (default to student) ─────────
  BEGIN
    IF NEW.raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'moderator', 'student') THEN
      assigned_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    ELSE
      assigned_role := 'student'::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    assigned_role := 'student'::public.user_role;
  END;

  -- ── Step 3: Insert into public.profiles ─────────
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
    referred_by,
    role
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
    NULLIF(NEW.raw_user_meta_data->>'ref', ''),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Step 4: Process granular roles from metadata if any ──────────────────────
  IF NEW.raw_user_meta_data->>'granular_roles' IS NOT NULL THEN
    FOR granular_role_name IN
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'granular_roles')
    LOOP
      SELECT id INTO granular_role_id
      FROM public.roles
      WHERE name = granular_role_name
      LIMIT 1;

      IF granular_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, granted_by)
        VALUES (
          NEW.id,
          granular_role_id,
          NULLIF(NEW.raw_user_meta_data->>'invited_by', '')::UUID
        ) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- NOTE: Waitlist, Fraud Logs, and Referrals are now processed asynchronously
  -- via the 'process-new-user' Edge Function webhook to prevent auth failures.

  RETURN NEW;
END;
$$;
