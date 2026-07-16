-- =============================================================================
-- Migration: 0023_automated_reminders.sql
-- Description: Automates the verification reminder email system via pg_cron.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "supabase_vault" CASCADE;

CREATE OR REPLACE FUNCTION public.invoke_automated_verification_reminders()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_service_key TEXT;
  v_url TEXT;
  v_user_ids JSONB;
BEGIN
  -- 1. Gather all eligible user IDs into a JSON array
  SELECT jsonb_agg(id) INTO v_user_ids
  FROM public.get_verification_eligible_users();

  -- If no users are eligible, do nothing
  IF v_user_ids IS NULL OR jsonb_array_length(v_user_ids) = 0 THEN
    RETURN;
  END IF;

  -- 2. Read the service key from vault
  SELECT decrypted_secret INTO v_service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key' LIMIT 1;

  v_url := 'http://supabase-kong:8000/functions/v1/send-verification-reminder';

  IF v_service_key IS NOT NULL THEN
    -- 3. Invoke the Edge Function with the batch of user IDs
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_service_key, 'Content-Type', 'application/json'),
      body := jsonb_build_object('user_ids', v_user_ids, 'trigger_source', 'auto')
    );
  ELSE
    RAISE WARNING 'service_role_key not found in vault.decrypted_secrets. Cannot send reminders.';
  END IF;
END;
$$;

-- Schedule the automated reminder job to run daily at 10:00 AM UTC
DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('automated-verification-reminders');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;

SELECT cron.schedule(
  'automated-verification-reminders',
  '0 10 * * *',
  $$ SELECT public.invoke_automated_verification_reminders(); $$
);
