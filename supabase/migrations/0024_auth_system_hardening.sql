-- Migration: 0024_auth_system_hardening.sql
-- Description: Adds server-side brute force protection by tracking login attempts.

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempt_count INT DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone (to check if locked) but no direct inserts
CREATE POLICY "Anyone can read login attempts"
  ON public.login_attempts FOR SELECT
  USING (true);

-- Create RPC to record attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(user_email TEXT, is_success BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INT;
  current_locked_until TIMESTAMPTZ;
BEGIN
  -- Get current state
  SELECT attempt_count, locked_until INTO current_count, current_locked_until
  FROM public.login_attempts
  WHERE email = user_email;

  -- Check if currently locked
  IF current_locked_until IS NOT NULL AND current_locked_until > NOW() THEN
    -- Even if successful, ignore because account is locked
    RETURN;
  END IF;

  IF is_success THEN
    -- Reset on success
    IF current_count IS NOT NULL THEN
      UPDATE public.login_attempts
      SET attempt_count = 0, locked_until = NULL, last_attempt_at = NOW()
      WHERE email = user_email;
    END IF;
  ELSE
    -- Increment on failure
    IF current_count IS NULL THEN
      INSERT INTO public.login_attempts (email, attempt_count, last_attempt_at)
      VALUES (user_email, 1, NOW());
    ELSE
      -- If reaching 5, lock for 15 minutes
      IF current_count + 1 >= 5 THEN
        UPDATE public.login_attempts
        SET attempt_count = current_count + 1,
            last_attempt_at = NOW(),
            locked_until = NOW() + INTERVAL '15 minutes'
        WHERE email = user_email;
      ELSE
        UPDATE public.login_attempts
        SET attempt_count = current_count + 1,
            last_attempt_at = NOW()
        WHERE email = user_email;
      END IF;
    END IF;
  END IF;
END;
$$;

-- Create RPC to check account status
CREATE OR REPLACE FUNCTION public.check_account_status(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_locked_until TIMESTAMPTZ;
BEGIN
  SELECT locked_until INTO current_locked_until
  FROM public.login_attempts
  WHERE email = user_email;

  IF current_locked_until IS NOT NULL AND current_locked_until > NOW() THEN
    RETURN jsonb_build_object('is_locked', true, 'locked_until', current_locked_until);
  END IF;

  RETURN jsonb_build_object('is_locked', false);
END;
$$;
