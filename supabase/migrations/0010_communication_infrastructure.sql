-- =============================================================================
-- Migration: 0010_communication_infrastructure.sql
-- Description: Complete Communication Platform schema — email queue, priority
--              engine, quota management, communication preferences, audiences,
--              brand settings, and domain event log.
-- =============================================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE public.email_priority AS ENUM ('critical', 'high', 'medium', 'low', 'bulk');
CREATE TYPE public.email_queue_status AS ENUM ('pending', 'processing', 'delivered', 'failed', 'cancelled', 'retrying', 'scheduled', 'dead_letter');
CREATE TYPE public.comm_channel AS ENUM ('email', 'sms', 'push', 'whatsapp', 'in_app');
CREATE TYPE public.comm_event_status AS ENUM ('received', 'processed', 'failed', 'skipped');

-- ── Helper: set_updated_at ─────────────────────────────────────────────────────
-- Use the existing handle_updated_at if present, else create a portable alias.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── 1. Brand Settings (singleton) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.brand_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      TEXT NOT NULL DEFAULT 'Universe',
  logo_url          TEXT,
  primary_color     TEXT NOT NULL DEFAULT '#00D084',
  secondary_color   TEXT NOT NULL DEFAULT '#050810',
  accent_color      TEXT NOT NULL DEFAULT '#6366F1',
  text_color        TEXT NOT NULL DEFAULT '#1e293b',
  bg_color          TEXT NOT NULL DEFAULT '#f8fafc',
  font_family       TEXT NOT NULL DEFAULT 'Inter, sans-serif',
  social_links      JSONB NOT NULL DEFAULT '{"twitter":"","linkedin":"","instagram":"","facebook":""}'::jsonb,
  footer_text       TEXT DEFAULT '© 2026 Universe. All rights reserved.',
  contact_email     TEXT DEFAULT 'hello@universeicos.app',
  address           TEXT,
  unsubscribe_url   TEXT DEFAULT 'https://universeicos.app/unsubscribe',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Singleton: only one row may exist
CREATE UNIQUE INDEX IF NOT EXISTS uq_brand_settings_singleton ON public.brand_settings ((TRUE));

INSERT INTO public.brand_settings (company_name, primary_color, footer_text)
VALUES ('Universe', '#00D084', '© 2026 Universe. All rights reserved.')
ON CONFLICT DO NOTHING;

DROP TRIGGER IF EXISTS brand_settings_updated_at ON public.brand_settings;
CREATE TRIGGER brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage brand settings" ON public.brand_settings;
DROP POLICY IF EXISTS "Service role full access brand_settings" ON public.brand_settings;
CREATE POLICY "Admins can manage brand settings"
  ON public.brand_settings FOR ALL USING (public.is_admin());

-- ── 2. Email Templates ────────────────────────────────────────────────────────
-- Add fields to email_templates if the table already exists; otherwise create.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_templates'
  ) THEN
    CREATE TABLE public.email_templates (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            TEXT NOT NULL UNIQUE,
      slug            TEXT NOT NULL UNIQUE,
      subject         TEXT NOT NULL,
      description     TEXT,
      category        TEXT NOT NULL DEFAULT 'transactional',
      priority        public.email_priority NOT NULL DEFAULT 'medium',
      component_name  TEXT,           -- e.g. 'WelcomeEmail' — maps to React Email component
      blocks          JSONB DEFAULT '[]'::jsonb,
      brand_settings  JSONB DEFAULT '{}'::jsonb,
      thumbnail_url   TEXT,
      is_system       BOOLEAN NOT NULL DEFAULT FALSE, -- system templates cannot be deleted
      is_active       BOOLEAN NOT NULL DEFAULT TRUE,
      created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    -- Safely add columns if not already present
    ALTER TABLE public.email_templates
      ADD COLUMN IF NOT EXISTS slug            TEXT,
      ADD COLUMN IF NOT EXISTS description     TEXT,
      ADD COLUMN IF NOT EXISTS category        TEXT NOT NULL DEFAULT 'transactional',
      ADD COLUMN IF NOT EXISTS priority        public.email_priority NOT NULL DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS component_name  TEXT,
      ADD COLUMN IF NOT EXISTS blocks          JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS brand_settings  JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS thumbnail_url   TEXT,
      ADD COLUMN IF NOT EXISTS is_system       BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_active       BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS email_templates_updated_at ON public.email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage templates" ON public.email_templates;
CREATE POLICY "Admins manage templates" ON public.email_templates FOR ALL USING (public.is_admin());

-- Seed system templates
INSERT INTO public.email_templates (name, slug, subject, category, priority, component_name, is_system) VALUES
  ('Welcome Email',            'welcome',              'Welcome to Universe! 🚀',                 'auth',          'high',     'WelcomeEmail',           TRUE),
  ('Email Verification',       'verify-email',         'Verify your Universe email',              'auth',          'critical', 'VerifyEmail',            TRUE),
  ('Password Reset',           'reset-password',       'Reset your Universe password',            'auth',          'critical', 'ResetPasswordEmail',     TRUE),
  ('Magic Link Login',         'magic-link',           'Your Universe login link',                'auth',          'critical', 'MagicLinkEmail',         TRUE),
  ('Password Changed',         'password-changed',     'Your password was changed',               'security',      'high',     'PasswordChangedEmail',   TRUE),
  ('Admin Invitation',         'admin-invitation',     'You''ve been invited to Universe',        'auth',          'critical', 'AdminInvitationEmail',   TRUE),
  ('Account Activated',        'account-activated',    'Your Universe account is active!',        'auth',          'high',     'AccountActivatedEmail',  TRUE),
  ('Account Suspended',        'account-suspended',    'Your Universe account has been suspended','security',      'high',     'AccountSuspendedEmail',  TRUE),
  ('Waitlist Confirmation',    'waitlist-confirm',     'You''re on the Universe waitlist!',       'transactional', 'high',     'WaitlistConfirmationEmail', TRUE),
  ('Referral Success',         'referral-success',     'Someone joined using your link! 🎉',      'transactional', 'medium',   'ReferralSuccessEmail',   TRUE),
  ('Referral Milestone',       'referral-milestone',   'You''ve hit a referral milestone! 🏆',   'transactional', 'medium',   'ReferralMilestoneEmail', TRUE),
  ('Beta Invitation',          'beta-invitation',      'You''re invited to the Universe Beta!',  'transactional', 'high',     'BetaInvitationEmail',    TRUE),
  ('Announcement',             'announcement',         'An update from Universe',                 'marketing',     'medium',   'AnnouncementEmail',      TRUE),
  ('Survey Invitation',        'survey-invitation',    'Your opinion matters to us 📋',          'transactional', 'medium',   'SurveyInvitationEmail',  TRUE),
  ('Launch Announcement',      'launch-announcement',  'Universe is live! 🚀',                   'marketing',     'high',     'LaunchAnnouncementEmail',TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Email Campaigns ────────────────────────────────────────────────────────
-- Upgrade existing table and add missing columns.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_campaigns'
  ) THEN
    CREATE TABLE public.email_campaigns (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            TEXT NOT NULL,
      subject         TEXT NOT NULL,
      template_id     UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
      audience        TEXT NOT NULL DEFAULT 'all',
      audience_filter JSONB DEFAULT '{}'::jsonb,
      status          TEXT NOT NULL DEFAULT 'draft',
      priority        public.email_priority NOT NULL DEFAULT 'bulk',
      html_body       TEXT,
      sent_count      INTEGER DEFAULT 0,
      open_rate       NUMERIC(5, 2),
      click_rate      NUMERIC(5, 2),
      bounce_rate     NUMERIC(5, 2),
      failure_count   INTEGER DEFAULT 0,
      scheduled_at    TIMESTAMPTZ,
      sent_at         TIMESTAMPTZ,
      created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    ALTER TABLE public.email_campaigns
      ADD COLUMN IF NOT EXISTS name            TEXT,
      ADD COLUMN IF NOT EXISTS template_id     UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS audience        TEXT NOT NULL DEFAULT 'all',
      ADD COLUMN IF NOT EXISTS audience_filter JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS priority        public.email_priority NOT NULL DEFAULT 'bulk',
      ADD COLUMN IF NOT EXISTS html_body       TEXT,
      ADD COLUMN IF NOT EXISTS sent_count      INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS open_rate       NUMERIC(5, 2),
      ADD COLUMN IF NOT EXISTS click_rate      NUMERIC(5, 2),
      ADD COLUMN IF NOT EXISTS bounce_rate     NUMERIC(5, 2),
      ADD COLUMN IF NOT EXISTS failure_count   INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS scheduled_at    TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage campaigns" ON public.email_campaigns;
CREATE POLICY "Admins manage campaigns" ON public.email_campaigns FOR ALL USING (public.is_admin());

-- ── 4. Audiences ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  filters     JSONB NOT NULL DEFAULT '{}'::jsonb,  -- e.g. {"role":"student","min_referrals":5}
  is_dynamic  BOOLEAN NOT NULL DEFAULT TRUE,        -- re-evaluated at send time
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS audiences_updated_at ON public.audiences;
CREATE TRIGGER audiences_updated_at
  BEFORE UPDATE ON public.audiences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage audiences" ON public.audiences;
CREATE POLICY "Admins manage audiences" ON public.audiences FOR ALL USING (public.is_admin());

-- Seed default audiences
INSERT INTO public.audiences (name, description, filters) VALUES
  ('All Users',       'Every registered user',                          '{"role": "any"}'::jsonb),
  ('Waitlist',        'All users currently on the waitlist',            '{"status": "waitlist"}'::jsonb),
  ('Students',        'Signed-up students',                             '{"role": "student"}'::jsonb),
  ('Admins',          'All admin users',                                '{"role": ["admin","super_admin","moderator"]}'::jsonb),
  ('Beta Qualified',  'Users with 5+ referrals',                       '{"min_referrals": 5}'::jsonb),
  ('Top Referrers',   'Users in the top 100 by referral count',        '{"top_referrers": 100}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ── 5. Communication Events (Domain Event Log) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communication_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,           -- e.g. 'waitlist.joined', 'referral.milestone'
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  channel     public.comm_channel NOT NULL DEFAULT 'email',
  priority    public.email_priority NOT NULL DEFAULT 'medium',
  status      public.comm_event_status NOT NULL DEFAULT 'received',
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comm_events_user_id    ON public.communication_events(user_id);
CREATE INDEX IF NOT EXISTS idx_comm_events_event_type ON public.communication_events(event_type);
CREATE INDEX IF NOT EXISTS idx_comm_events_status     ON public.communication_events(status);
CREATE INDEX IF NOT EXISTS idx_comm_events_created_at ON public.communication_events(created_at DESC);

ALTER TABLE public.communication_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read communication events" ON public.communication_events;
CREATE POLICY "Admins can read communication events"
  ON public.communication_events FOR SELECT USING (public.is_admin());

-- ── 6. Email Queue ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID REFERENCES public.communication_events(id) ON DELETE SET NULL,
  campaign_id         UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  template_id         UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  priority            public.email_priority NOT NULL DEFAULT 'medium',
  recipient_email     TEXT NOT NULL,
  recipient_name      TEXT,
  subject             TEXT NOT NULL,
  template_data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  rendered_html       TEXT,             -- cached render from Edge Function
  status              public.email_queue_status NOT NULL DEFAULT 'pending',
  provider_name       TEXT DEFAULT 'resend',
  provider_message_id TEXT,            -- ID returned by the provider on success
  provider_response   JSONB,
  error_message       TEXT,
  attempts            SMALLINT NOT NULL DEFAULT 0,
  max_attempts        SMALLINT NOT NULL DEFAULT 5,
  next_attempt_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_at        TIMESTAMPTZ,     -- non-null = scheduled delivery
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Priority-aware queue processing index
CREATE INDEX IF NOT EXISTS idx_email_queue_worker
  ON public.email_queue(priority DESC, next_attempt_at ASC)
  WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_email_queue_campaign   ON public.email_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status     ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at DESC);

DROP TRIGGER IF EXISTS email_queue_updated_at ON public.email_queue;
CREATE TRIGGER email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage email queue" ON public.email_queue;
CREATE POLICY "Admins manage email queue" ON public.email_queue FOR ALL USING (public.is_admin());

-- ── 7. Email Logs (delivery events from provider webhooks) ────────────────────
CREATE TABLE IF NOT EXISTS public.email_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id          UUID REFERENCES public.email_queue(id) ON DELETE SET NULL,
  campaign_id       UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  event_type        TEXT NOT NULL,   -- 'queued','sent','delivered','bounced','deferred','complaint'
  provider_name     TEXT,
  provider_event_id TEXT,
  recipient_email   TEXT,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_queue_id    ON public.email_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at  ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_event_type  ON public.email_logs(event_type);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read email logs" ON public.email_logs;
CREATE POLICY "Admins can read email logs" ON public.email_logs FOR SELECT USING (public.is_admin());

-- ── 8. Communication Preferences ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.communication_preferences (
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category          TEXT NOT NULL,    -- 'announcements','marketing','surveys','referral_updates','beta_updates','product_updates'
  channel           public.comm_channel NOT NULL DEFAULT 'email',
  is_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category, channel)
);

CREATE INDEX IF NOT EXISTS idx_comm_prefs_user_id ON public.communication_preferences(user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.comm_prefs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS comm_prefs_updated_at ON public.communication_preferences;
CREATE TRIGGER comm_prefs_updated_at
  BEFORE UPDATE ON public.communication_preferences
  FOR EACH ROW EXECUTE FUNCTION public.comm_prefs_updated_at();

ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own comm prefs" ON public.communication_preferences;
DROP POLICY IF EXISTS "Admins manage all comm prefs" ON public.communication_preferences;
CREATE POLICY "Users manage own comm prefs"
  ON public.communication_preferences FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage all comm prefs"
  ON public.communication_preferences FOR ALL USING (public.is_admin());

-- ── 9. Provider Quotas ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.provider_quotas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name    TEXT NOT NULL UNIQUE,
  daily_limit      INTEGER NOT NULL DEFAULT 3000,
  daily_used       INTEGER NOT NULL DEFAULT 0,
  monthly_limit    INTEGER NOT NULL DEFAULT 100000,
  monthly_used     INTEGER NOT NULL DEFAULT 0,
  reserve_buffer   INTEGER NOT NULL DEFAULT 200,  -- always kept for Critical/High
  last_reset_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS provider_quotas_updated_at ON public.provider_quotas;
CREATE TRIGGER provider_quotas_updated_at
  BEFORE UPDATE ON public.provider_quotas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.provider_quotas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage provider quotas" ON public.provider_quotas;
CREATE POLICY "Admins manage provider quotas" ON public.provider_quotas FOR ALL USING (public.is_admin());

-- Seed Resend free-tier defaults
INSERT INTO public.provider_quotas (provider_name, daily_limit, monthly_limit, reserve_buffer)
VALUES ('resend', 100, 3000, 20)
ON CONFLICT (provider_name) DO NOTHING;

-- ── 10. Database Function: queue_email ────────────────────────────────────────
-- Called by Edge Functions to atomically insert an email into the queue.
CREATE OR REPLACE FUNCTION public.queue_email(
  p_recipient_email   TEXT,
  p_recipient_name    TEXT,
  p_subject           TEXT,
  p_template_id       UUID,
  p_template_data     JSONB,
  p_priority          public.email_priority DEFAULT 'medium',
  p_event_id          UUID DEFAULT NULL,
  p_campaign_id       UUID DEFAULT NULL,
  p_scheduled_at      TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
  v_next_at TIMESTAMPTZ;
BEGIN
  v_next_at := COALESCE(p_scheduled_at, NOW());
  INSERT INTO public.email_queue (
    event_id, campaign_id, template_id, priority,
    recipient_email, recipient_name, subject, template_data,
    status, next_attempt_at, scheduled_at
  ) VALUES (
    p_event_id, p_campaign_id, p_template_id, p_priority,
    p_recipient_email, p_recipient_name, p_subject, p_template_data,
    CASE WHEN p_scheduled_at IS NOT NULL THEN 'scheduled' ELSE 'pending' END,
    v_next_at, p_scheduled_at
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── 11. Database Function: check_comm_preference ──────────────────────────────
-- Returns TRUE if a user has not opted out of a specific category/channel.
-- Always returns TRUE for security/auth categories.
CREATE OR REPLACE FUNCTION public.check_comm_preference(
  p_user_id  UUID,
  p_category TEXT,
  p_channel  public.comm_channel DEFAULT 'email'
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_is_auth BOOLEAN;
  v_pref BOOLEAN;
BEGIN
  -- Auth and security emails always bypass preferences
  v_is_auth := p_category IN ('auth', 'security');
  IF v_is_auth THEN RETURN TRUE; END IF;

  SELECT is_enabled INTO v_pref
  FROM public.communication_preferences
  WHERE user_id = p_user_id AND category = p_category AND channel = p_channel;

  -- Default to TRUE if no preference record exists (opt-in by default)
  RETURN COALESCE(v_pref, TRUE);
END;
$$;

-- ── 12. Database Function: get_queue_stats ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_queue_stats()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'pending',     COUNT(*) FILTER (WHERE status = 'pending'),
    'processing',  COUNT(*) FILTER (WHERE status = 'processing'),
    'delivered',   COUNT(*) FILTER (WHERE status = 'delivered'),
    'failed',      COUNT(*) FILTER (WHERE status = 'failed'),
    'retrying',    COUNT(*) FILTER (WHERE status = 'retrying'),
    'dead_letter', COUNT(*) FILTER (WHERE status = 'dead_letter'),
    'scheduled',   COUNT(*) FILTER (WHERE status = 'scheduled'),
    'total',       COUNT(*)
  ) FROM public.email_queue;
$$;

-- ── 13. Database Function: get_delivery_stats ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_delivery_stats(p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'delivered',   COUNT(*) FILTER (WHERE event_type = 'delivered'),
    'bounced',     COUNT(*) FILTER (WHERE event_type = 'bounced'),
    'deferred',    COUNT(*) FILTER (WHERE event_type = 'deferred'),
    'complained',  COUNT(*) FILTER (WHERE event_type = 'complaint'),
    'total_sent',  COUNT(*) FILTER (WHERE event_type IN ('sent','delivered'))
  ) FROM public.email_logs
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
$$;

-- ── 14. Reset provider daily quota (called by a scheduled Edge Function) ──────
CREATE OR REPLACE FUNCTION public.reset_provider_daily_quota(p_provider TEXT DEFAULT 'resend')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.provider_quotas
     SET daily_used = 0, last_reset_at = NOW()
   WHERE provider_name = p_provider
     AND last_reset_at < NOW() - INTERVAL '1 day';
END;
$$;

-- ── 15. Increment provider daily quota ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_provider_quota(p_provider TEXT, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.provider_quotas
     SET daily_used = daily_used + p_amount,
         monthly_used = monthly_used + p_amount,
         updated_at = NOW()
   WHERE provider_name = p_provider;
END;
$$;
