-- Migration: 0019_fix_admin_invite_trigger.sql
-- Description: Fix handle_new_user() to skip waitlist insertion for admin/moderator
-- roles. When an admin is invited via inviteUserByEmail, Supabase fires the
-- on_auth_user_created trigger. The waitlist table has full_name NOT NULL
-- which causes a constraint violation (and "Database error saving new user")
-- because invited admins don't have full_name in their metadata.
-- Solution: Only insert into waitlist for 'student' role users.

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

  -- ── Step 3: Insert into public.profiles with ALL available metadata ─────────
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

  -- ── Step 5: Process referral if a valid, non-self referral code was supplied ─
  -- Only relevant for students; admins don't have referral codes in metadata
  IF assigned_role = 'student' AND NULLIF(NEW.raw_user_meta_data->>'ref', '') IS NOT NULL THEN
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

  -- ── Step 6: Insert into public.waitlist — ONLY for student role ──────────────
  -- Admin/moderator/super_admin users are invited directly and should NOT
  -- appear in the waitlist. Skipping this for non-student roles prevents the
  -- "Database error saving new user" caused by the full_name NOT NULL constraint.
  IF assigned_role = 'student' THEN
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
  END IF;

  RETURN NEW;
END;
$$;
