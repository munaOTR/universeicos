-- =============================================================================
-- Migration: 0016_analytics_platform.sql
-- Description: Analytics & Monitoring Platform database foundation.
--   1. analytics_events    — generic event sink for all platform actions
--   2. platform_alerts     — persistent alert state with acknowledgement
--   3. Aggregate RPCs      — server-side aggregations for dashboards
--   4. Auth event logging  — insert login/logout events from activity
--   5. Extended metrics view
-- =============================================================================

-- ── 1. Analytics Events ───────────────────────────────────────────────────────
-- Generic, schema-flexible event table. Every module can emit events here
-- without schema changes (properties is JSONB). Future-proof for Marketplace,
-- Study Hub, AI Assistant, etc.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  TEXT        NOT NULL,                          -- e.g. 'page_view','referral.completed','survey.started'
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id  TEXT,                                          -- client-side session token
  properties  JSONB       NOT NULL DEFAULT '{}'::jsonb,      -- arbitrary event metadata
  page_url    TEXT,
  referrer    TEXT,
  device_type TEXT        DEFAULT 'desktop',                 -- 'desktop','mobile','tablet'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name       ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id    ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_date  ON public.analytics_events(event_name, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events FOR SELECT USING (public.is_admin());
CREATE POLICY "Service role full access analytics_events"
  ON public.analytics_events FOR ALL USING (auth.role() = 'service_role');

-- ── 2. Platform Alerts ────────────────────────────────────────────────────────
-- Persistent alert state. Workers and monitoring jobs insert here.
-- Admins can acknowledge and resolve alerts from the UI.

CREATE TABLE IF NOT EXISTS public.platform_alerts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type        TEXT        NOT NULL,     -- 'queue_backlog','provider_down','high_error_rate','quota_warning'
  severity          TEXT        NOT NULL DEFAULT 'warning',  -- 'critical','warning','info'
  title             TEXT        NOT NULL,
  message           TEXT        NOT NULL,
  metadata          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  is_acknowledged   BOOLEAN     NOT NULL DEFAULT FALSE,
  acknowledged_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at   TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_alerts_type     ON public.platform_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_severity ON public.platform_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_platform_alerts_open     ON public.platform_alerts(is_acknowledged, resolved_at)
  WHERE is_acknowledged = FALSE AND resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_alerts_created  ON public.platform_alerts(created_at DESC);

ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage platform alerts"
  ON public.platform_alerts FOR ALL USING (public.is_admin());

-- ── 3. Extend admin_dashboard_metrics view ────────────────────────────────────
DROP VIEW IF EXISTS public.admin_dashboard_metrics;

CREATE OR REPLACE VIEW public.admin_dashboard_metrics AS
SELECT
  -- Users
  (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL)                                           AS total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '24h') AS new_users_24h,
  (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7d')  AS new_users_7d,
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

-- ── 4. Aggregate RPC: Signup timeseries ──────────────────────────────────────
-- Returns daily signup counts between start_date and end_date.
CREATE OR REPLACE FUNCTION public.get_signup_timeseries(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (date TEXT, count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM public.profiles
  WHERE created_at >= p_start_date
    AND created_at <  p_end_date
    AND deleted_at IS NULL
  GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
  ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC');
$$;

-- ── 5. Aggregate RPC: Referral timeseries ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_referral_timeseries(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (date TEXT, count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
    COUNT(*) AS count
  FROM public.referrals
  WHERE created_at >= p_start_date
    AND created_at <  p_end_date
  GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
  ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC');
$$;

-- ── 6. Aggregate RPC: Communication delivery stats ───────────────────────────
CREATE OR REPLACE FUNCTION public.get_comms_delivery_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  date       TEXT,
  sent       BIGINT,
  delivered  BIGINT,
  failed     BIGINT,
  retrying   BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
    COUNT(*) FILTER (WHERE status IN ('processing','delivered','failed','retrying','dead_letter')) AS sent,
    COUNT(*) FILTER (WHERE status = 'delivered')  AS delivered,
    COUNT(*) FILTER (WHERE status IN ('failed','dead_letter')) AS failed,
    COUNT(*) FILTER (WHERE status = 'retrying')   AS retrying
  FROM public.email_queue
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
  ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC');
$$;

-- ── 7. Aggregate RPC: Active users per day ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_activity_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (date TEXT, active_users BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
    COUNT(DISTINCT user_id) AS active_users
  FROM public.activity_logs
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND user_id IS NOT NULL
  GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC')
  ORDER BY DATE_TRUNC('day', created_at AT TIME ZONE 'UTC');
$$;

-- ── 8. Aggregate RPC: Queue status summary ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_queue_status_summary()
RETURNS TABLE (status TEXT, count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT status::TEXT, COUNT(*) AS count
  FROM public.email_queue
  GROUP BY status
  ORDER BY count DESC;
$$;

-- ── 9. Aggregate RPC: University breakdown ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_university_breakdown(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (university TEXT, count BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(SPLIT_PART(university, '(', 1), 'Unknown') AS university,
    COUNT(*) AS count
  FROM public.profiles
  WHERE university IS NOT NULL AND deleted_at IS NULL
  GROUP BY COALESCE(SPLIT_PART(university, '(', 1), 'Unknown')
  ORDER BY count DESC
  LIMIT p_limit;
$$;

-- ── 10. Aggregate RPC: Top referrers ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_top_referrers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id    UUID,
  full_name  TEXT,
  email      TEXT,
  referrals  BIGINT,
  points     INTEGER
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id         AS user_id,
    p.full_name,
    p.email,
    COUNT(r.id)  AS referrals,
    p.points
  FROM public.profiles p
  LEFT JOIN public.referrals r ON r.referrer_id = p.id
  WHERE p.deleted_at IS NULL
  GROUP BY p.id, p.full_name, p.email, p.points
  HAVING COUNT(r.id) > 0
  ORDER BY referrals DESC, p.points DESC
  LIMIT p_limit;
$$;

-- ── 11. RPC: Acknowledge alert ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.acknowledge_alert(p_alert_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.platform_alerts
  SET
    is_acknowledged = TRUE,
    acknowledged_by = auth.uid(),
    acknowledged_at = NOW()
  WHERE id = p_alert_id;
END;
$$;
