-- =============================================================================
-- Migration: 0022_fix_queue_email_status_cast.sql
-- Description: Fix type mismatch in queue_email() — the CASE expression
--              returned plain TEXT but email_queue.status is email_queue_status enum.
--              Added explicit ::public.email_queue_status casts.
-- =============================================================================

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
  v_id      UUID;
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
    -- Explicit cast to the enum type to prevent "expression is of type text" error
    CASE
      WHEN p_scheduled_at IS NOT NULL THEN 'scheduled'::public.email_queue_status
      ELSE 'pending'::public.email_queue_status
    END,
    v_next_at, p_scheduled_at
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
