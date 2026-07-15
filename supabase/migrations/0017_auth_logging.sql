-- =============================================================================
-- Migration: 0017_auth_logging.sql
-- Description: Implementation of Authentication Logging to address Audit findings.
-- =============================================================================

-- 1. Create a function to handle auth user inserts/updates for logging
CREATE OR REPLACE FUNCTION public.log_auth_event()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Log login events when last_sign_in_at changes
  IF TG_OP = 'UPDATE' AND (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at) THEN
    INSERT INTO public.activity_logs (
      user_id,
      activity_type,
      entity_type,
      entity_id,
      metadata
    ) VALUES (
      NEW.id,
      'login',
      'auth',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'last_sign_in_at', NEW.last_sign_in_at,
        'provider', NEW.raw_app_meta_data->>'provider'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_auth_event();

-- Note: "auth failures" and "logout" can't easily be logged via DB triggers on auth.users alone.
-- Logout is stateless or removes session, auth failures don't write to auth.users. 
-- For those, Supabase logs via Edge Functions or API must be utilized. 
-- However, tracking last_sign_in_at is the primary indicator of successful logins.
