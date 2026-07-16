-- =============================================================================
-- Migration: 0011_cron_scheduling.sql
-- Description: Enables pg_cron and pg_net. Configures the autonomous queue
--              worker scheduling and introduces a safe batch locking mechanism.
-- =============================================================================

-- ── 1. Extensions ─────────────────────────────────────────────────────────────
-- Requires superuser privileges (Supabase handles this for these extensions)
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ── 2. Suppressed Emails Table (Phase 5 Prep) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  reason          TEXT NOT NULL, -- e.g., 'hard_bounce', 'complaint'
  provider        TEXT,
  event_id        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- if manually suppressed
);

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

DROP TRIGGER IF EXISTS suppressed_emails_updated_at ON public.suppressed_emails;
CREATE TRIGGER suppressed_emails_updated_at
  BEFORE UPDATE ON public.suppressed_emails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage suppressed emails" ON public.suppressed_emails FOR ALL USING (public.is_admin());

-- ── 3. Queue Locking Mechanism ────────────────────────────────────────────────
-- Retrieves the next batch of emails to process, locking them securely so
-- concurrent workers do not process the same emails.
CREATE OR REPLACE FUNCTION public.get_next_queue_batch(p_limit INTEGER DEFAULT 20, p_block_low_priority BOOLEAN DEFAULT FALSE)
RETURNS SETOF public.email_queue
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH next_batch AS (
    SELECT id
    FROM public.email_queue
    WHERE status IN ('pending', 'retrying')
      AND next_attempt_at <= NOW()
      AND (p_block_low_priority = FALSE OR priority IN ('critical', 'high'))
      -- Skip suppressed emails
      AND recipient_email NOT IN (SELECT email FROM public.suppressed_emails)
    ORDER BY priority DESC, next_attempt_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.email_queue q
  SET status = 'processing',
      updated_at = NOW()
  FROM next_batch nb
  WHERE q.id = nb.id
  RETURNING q.*;
END;
$$;

-- ── 4. Fail Suppressed Emails ─────────────────────────────────────────────────
-- A cron job to automatically transition queue items to 'failed' if their 
-- recipient_email exists in suppressed_emails and they are pending/retrying.
CREATE OR REPLACE FUNCTION public.fail_suppressed_queue_items()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.email_queue
  SET status = 'failed',
      error_message = 'Recipient is suppressed',
      updated_at = NOW()
  WHERE status IN ('pending', 'retrying')
    AND recipient_email IN (SELECT email FROM public.suppressed_emails);
END;
$$;

-- ── 5. Cron Jobs ──────────────────────────────────────────────────────────────

-- Safely remove existing jobs before (re)creating them.
-- Uses exception handling so the migration never fails on a fresh database
-- where the jobs do not yet exist.
DO $$
DECLARE
  _jobs TEXT[] := ARRAY['invoke-comms-queue-worker', 'reset-provider-quotas', 'fail-suppressed-queue-items'];
  _job  TEXT;
BEGIN
  FOREACH _job IN ARRAY _jobs LOOP
    BEGIN
      PERFORM cron.unschedule(_job);
    EXCEPTION WHEN OTHERS THEN
      -- Job didn't exist — safe to ignore
      NULL;
    END;
  END LOOP;
END;
$$;

-- Job 1: Invoke queue worker every minute
-- (Requires SUPABASE_SERVICE_ROLE_KEY and URL to be configured in vault or env, 
-- but for pg_net we typically pass them in the payload or use a secured endpoint.
-- Alternatively, if Supabase Edge Functions are deployed, we use pg_net.http_post).
-- NOTE: In local/staging, the URL must point to your deployed function.
-- For production, replace 'YOUR_PROJECT_REF' with the actual project ref via Vault.
-- We will use a placeholder here; the user will configure the exact URL via Vault or 
-- the Supabase Dashboard. 

-- The following block schedules the queue worker every minute.
-- Ensure SUPABASE_SERVICE_ROLE_KEY and the URL are correctly provided or use vault.
CREATE EXTENSION IF NOT EXISTS "supabase_vault" CASCADE;

CREATE OR REPLACE FUNCTION public.invoke_comms_queue_worker_cron()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_service_key TEXT;
  v_url TEXT;
BEGIN
  -- Read the service key from vault (must be seeded by admin)
  SELECT decrypted_secret INTO v_service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key' LIMIT 1;

  -- Default to local/Kong network routing for edge functions
  v_url := 'http://supabase-kong:8000/functions/v1/comms-queue-worker';

  IF v_service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Authorization', 'Bearer ' || v_service_key, 'Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  ELSE
    RAISE WARNING 'service_role_key not found in vault.decrypted_secrets';
  END IF;
END;
$$;

SELECT cron.schedule(
  'invoke-comms-queue-worker',
  '* * * * *',
  $$ SELECT public.invoke_comms_queue_worker_cron(); $$
);

-- Job 2: Reset daily quotas at midnight
SELECT cron.schedule(
  'reset-provider-quotas',
  '0 0 * * *',
  $$ SELECT public.reset_provider_daily_quota('resend'); $$
);

-- Job 3: Fail suppressed items every 5 minutes
SELECT cron.schedule(
  'fail-suppressed-queue-items',
  '*/5 * * * *',
  $$ SELECT public.fail_suppressed_queue_items(); $$
);
