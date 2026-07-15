-- =============================================================================
-- Migration: 0018_email_verification_management.sql
-- Description: Email Verification Management System
--   1. verification_reminders   — tracks every reminder sent per user
--   2. sync_verification_status — trigger syncing auth.email_confirmed_at → profiles.is_verified
--   3. get_users_with_verification_status() — admin RPC joining profiles + auth data
--   4. get_verification_stats()             — aggregate KPIs
--   5. get_verification_eligible_users()    — users ready for a reminder
--   6. get_verification_timeseries()        — daily verification counts
--   7. Updated admin_dashboard_metrics view with verification columns
--   8. Seed verification-reminder email template
-- =============================================================================

-- ── 1. Verification Reminders Table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.verification_reminders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  triggered_by    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,  -- NULL = automatic
  trigger_source  TEXT        NOT NULL DEFAULT 'manual'
                              CHECK (trigger_source IN ('manual', 'bulk', 'auto')),
  queue_id        UUID        REFERENCES public.email_queue(id) ON DELETE SET NULL,
  converted_at    TIMESTAMPTZ,             -- set when user verifies after this reminder
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_reminders_user_id ON public.verification_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_reminders_sent_at ON public.verification_reminders(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_reminders_user_sent ON public.verification_reminders(user_id, sent_at DESC);

ALTER TABLE public.verification_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage verification reminders" ON public.verification_reminders;
CREATE POLICY "Admins manage verification reminders"
  ON public.verification_reminders FOR ALL
  USING (public.is_admin());

-- ── 2. Sync trigger: auth.users.email_confirmed_at → profiles.is_verified ────
-- This keeps profiles.is_verified in sync with the authoritative Supabase Auth
-- record so that all application code reading profiles.is_verified is correct.

CREATE OR REPLACE FUNCTION public.sync_email_verification()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only fire when email_confirmed_at actually changes
  IF TG_OP = 'UPDATE' AND
     (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) AND
     NEW.email_confirmed_at IS NOT NULL
  THEN
    -- Update profiles.is_verified
    UPDATE public.profiles
    SET
      is_verified = TRUE,
      updated_at  = NOW()
    WHERE id = NEW.id;

    -- Mark any open verification reminders as converted
    UPDATE public.verification_reminders
    SET converted_at = NOW()
    WHERE user_id    = NEW.id
      AND converted_at IS NULL;

    -- Emit analytics event
    INSERT INTO public.analytics_events (event_name, user_id, properties)
    VALUES (
      'verification.completed',
      NEW.id,
      jsonb_build_object(
        'email',              NEW.email,
        'email_confirmed_at', NEW.email_confirmed_at
      )
    );
  END IF;

  -- Handle unverification (edge case: email changed)
  IF TG_OP = 'UPDATE' AND
     (OLD.email_confirmed_at IS NOT NULL) AND
     NEW.email_confirmed_at IS NULL
  THEN
    UPDATE public.profiles
    SET is_verified = FALSE, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach to auth.users (safe to re-create)
DROP TRIGGER IF EXISTS on_auth_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_verification();

-- ── 3. RPC: get_users_with_verification_status ───────────────────────────────
-- Returns profiles joined with auth.users for verification state.
-- Only callable by admins (SECURITY DEFINER + internal guard).

CREATE OR REPLACE FUNCTION public.get_users_with_verification_status(
  p_limit   INTEGER DEFAULT 200,
  p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                    UUID,
  email                 TEXT,
  full_name             TEXT,
  university            TEXT,
  faculty               TEXT,
  department            TEXT,
  role                  TEXT,
  points                INTEGER,
  is_verified           BOOLEAN,
  referral_code         TEXT,
  referred_by           TEXT,
  waitlist_position     INTEGER,
  avatar_url            TEXT,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ,
  -- Verification-specific fields
  email_confirmed_at    TIMESTAMPTZ,
  auth_provider         TEXT,
  reminder_count        BIGINT,
  last_reminder_at      TIMESTAMPTZ,
  is_eligible_for_reminder BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admins only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.university,
    p.faculty,
    p.department,
    p.role::TEXT,
    p.points,
    p.is_verified,
    p.referral_code,
    p.referred_by,
    p.waitlist_position,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    -- Auth data
    au.email_confirmed_at,
    COALESCE(au.raw_app_meta_data->>'provider', 'email') AS auth_provider,
    -- Reminder stats
    COALESCE(rem.reminder_count, 0)     AS reminder_count,
    rem.last_reminder_at,
    -- Eligibility: unverified + registered > 24h ago + no reminder in last 48h + active
    CASE
      WHEN au.email_confirmed_at IS NOT NULL THEN FALSE  -- already verified
      WHEN p.deleted_at IS NOT NULL          THEN FALSE  -- deleted
      WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN FALSE  -- too new
      WHEN rem.last_reminder_at > NOW() - INTERVAL '48 hours' THEN FALSE  -- recently reminded
      ELSE TRUE
    END AS is_eligible_for_reminder
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)          AS reminder_count,
      MAX(vr.sent_at)   AS last_reminder_at
    FROM public.verification_reminders vr
    WHERE vr.user_id = p.id
  ) rem ON TRUE
  WHERE p.deleted_at IS NULL
  ORDER BY p.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_users_with_verification_status(INTEGER, INTEGER) TO authenticated;

-- ── 4. RPC: get_verification_stats ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_verification_stats()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total         BIGINT;
  v_verified      BIGINT;
  v_unverified    BIGINT;
  v_rate          NUMERIC;
  v_eligible      BIGINT;
  v_reminders     BIGINT;
  v_conversions   BIGINT;
  v_verified_7d   BIGINT;
  v_verified_30d  BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admins only';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.profiles p
  WHERE p.deleted_at IS NULL;

  SELECT COUNT(*) INTO v_verified
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  WHERE p.deleted_at IS NULL AND au.email_confirmed_at IS NOT NULL;

  v_unverified := v_total - v_verified;
  v_rate       := CASE WHEN v_total > 0 THEN ROUND((v_verified::NUMERIC / v_total) * 100, 1) ELSE 0 END;

  SELECT COUNT(*) INTO v_eligible
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  LEFT JOIN LATERAL (
    SELECT MAX(vr.sent_at) AS last_reminder_at
    FROM public.verification_reminders vr
    WHERE vr.user_id = p.id
  ) rem ON TRUE
  WHERE p.deleted_at IS NULL
    AND au.email_confirmed_at IS NULL
    AND p.created_at < NOW() - INTERVAL '24 hours'
    AND (rem.last_reminder_at IS NULL OR rem.last_reminder_at < NOW() - INTERVAL '48 hours');

  SELECT COUNT(*) INTO v_reminders FROM public.verification_reminders;

  SELECT COUNT(*) INTO v_conversions
  FROM public.verification_reminders
  WHERE converted_at IS NOT NULL;

  SELECT COUNT(*) INTO v_verified_7d
  FROM auth.users
  WHERE email_confirmed_at >= NOW() - INTERVAL '7 days';

  SELECT COUNT(*) INTO v_verified_30d
  FROM auth.users
  WHERE email_confirmed_at >= NOW() - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'total_users',          v_total,
    'verified_count',       v_verified,
    'unverified_count',     v_unverified,
    'verification_rate',    v_rate,
    'eligible_for_reminder',v_eligible,
    'reminders_sent_total', v_reminders,
    'conversions_total',    v_conversions,
    'verified_last_7d',     v_verified_7d,
    'verified_last_30d',    v_verified_30d
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verification_stats() TO authenticated;

-- ── 5. RPC: get_verification_eligible_users ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_verification_eligible_users()
RETURNS TABLE (
  id         UUID,
  email      TEXT,
  full_name  TEXT,
  university TEXT,
  created_at TIMESTAMPTZ,
  reminder_count BIGINT,
  last_reminder_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admins only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.university,
    p.created_at,
    COALESCE(rem.reminder_count, 0),
    rem.last_reminder_at
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS reminder_count, MAX(vr.sent_at) AS last_reminder_at
    FROM public.verification_reminders vr
    WHERE vr.user_id = p.id
  ) rem ON TRUE
  WHERE p.deleted_at IS NULL
    AND au.email_confirmed_at IS NULL
    AND p.created_at < NOW() - INTERVAL '24 hours'
    AND (rem.last_reminder_at IS NULL OR rem.last_reminder_at < NOW() - INTERVAL '48 hours')
  ORDER BY p.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_verification_eligible_users() TO authenticated;

-- ── 6. RPC: get_verification_timeseries ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_verification_timeseries(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (date TEXT, verified_count BIGINT, reminder_count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('day', d.day), 'YYYY-MM-DD') AS date,
    COALESCE(v.vc, 0)                               AS verified_count,
    COALESCE(r.rc, 0)                               AS reminder_count
  FROM (
    SELECT generate_series(
      DATE_TRUNC('day', NOW() - ((p_days - 1) || ' days')::INTERVAL),
      DATE_TRUNC('day', NOW()),
      '1 day'::INTERVAL
    ) AS day
  ) d
  LEFT JOIN (
    SELECT DATE_TRUNC('day', email_confirmed_at) AS day, COUNT(*) AS vc
    FROM auth.users
    WHERE email_confirmed_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE_TRUNC('day', email_confirmed_at)
  ) v ON v.day = d.day
  LEFT JOIN (
    SELECT DATE_TRUNC('day', sent_at) AS day, COUNT(*) AS rc
    FROM public.verification_reminders
    WHERE sent_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE_TRUNC('day', sent_at)
  ) r ON r.day = d.day
  ORDER BY d.day;
$$;

GRANT EXECUTE ON FUNCTION public.get_verification_timeseries(INTEGER) TO authenticated;

-- ── 7. Update admin_dashboard_metrics view ────────────────────────────────────

DROP VIEW IF EXISTS public.admin_dashboard_metrics;

CREATE OR REPLACE VIEW public.admin_dashboard_metrics AS
SELECT
  -- Users
  (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL)                                           AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '24h') AS new_users_24h,
  (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7d')  AS new_users_7d,
  -- Verification
  (SELECT COUNT(*) FROM public.profiles p INNER JOIN auth.users au ON au.id = p.id WHERE p.deleted_at IS NULL AND au.email_confirmed_at IS NOT NULL) AS verified_users,
  (SELECT COUNT(*) FROM public.profiles p INNER JOIN auth.users au ON au.id = p.id WHERE p.deleted_at IS NULL AND au.email_confirmed_at IS NULL)     AS unverified_users,
  (SELECT COUNT(*) FROM public.verification_reminders)                                                      AS verification_reminders_sent,
  -- Waitlist
  (SELECT COUNT(*) FROM public.waitlist)                                                                     AS total_waitlist,
  -- Referrals
  (SELECT COUNT(*) FROM public.referrals)                                                                    AS total_referrals,
  (SELECT COUNT(*) FROM public.referrals WHERE status = 'completed')                                        AS completed_referrals,
  -- Email
  (SELECT COUNT(*) FROM public.email_queue WHERE status = 'pending')                                        AS queue_pending,
  (SELECT COUNT(*) FROM public.email_queue WHERE status = 'delivered' AND updated_at >= NOW() - INTERVAL '24h') AS emails_delivered_24h,
  (SELECT COUNT(*) FROM public.email_queue WHERE status = 'failed'    AND updated_at >= NOW() - INTERVAL '24h') AS emails_failed_24h,
  -- Feature votes
  (SELECT COUNT(*) FROM public.feature_requests)                                                             AS total_feature_votes,
  -- Alerts
  (SELECT COUNT(*) FROM public.platform_alerts WHERE is_acknowledged = FALSE AND resolved_at IS NULL)       AS open_alerts,
  -- Audit
  (SELECT COUNT(*) FROM public.audit_logs WHERE created_at >= NOW() - INTERVAL '24h')                      AS audit_events_24h;

-- ── 8. Seed: Verification Reminder email template ─────────────────────────────

INSERT INTO public.email_templates (name, slug, subject, category, priority, component_name, is_system)
VALUES (
  'Verification Reminder',
  'verification-reminder',
  'Still need to verify? Your Universe account is waiting 👋',
  'auth',
  'high',
  'VerificationReminderEmail',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- ── 9. Helper RPC: record_verification_reminder ───────────────────────────────
-- Called by Edge Function after queuing email — inserts reminder record.

CREATE OR REPLACE FUNCTION public.record_verification_reminder(
  p_user_id        UUID,
  p_triggered_by   UUID DEFAULT NULL,
  p_trigger_source TEXT DEFAULT 'manual',
  p_queue_id       UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.verification_reminders (
    user_id, triggered_by, trigger_source, queue_id, sent_at
  ) VALUES (
    p_user_id, p_triggered_by, p_trigger_source, p_queue_id, NOW()
  ) RETURNING id INTO v_id;

  -- Also emit analytics event
  INSERT INTO public.analytics_events (event_name, user_id, properties)
  VALUES (
    'verification.reminder.sent',
    p_user_id,
    jsonb_build_object(
      'trigger_source', p_trigger_source,
      'triggered_by',   p_triggered_by,
      'queue_id',       p_queue_id
    )
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_verification_reminder(UUID, UUID, TEXT, UUID) TO service_role;

-- ── 10. Performance indexes ───────────────────────────────────────────────────

-- Fast lookup of unverified profiles (for eligibility checks)
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified)
  WHERE is_verified = FALSE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_created_at_verification
  ON public.profiles(created_at DESC)
  WHERE deleted_at IS NULL;
