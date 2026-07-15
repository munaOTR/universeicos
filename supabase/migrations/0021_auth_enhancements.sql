-- =============================================================================
-- Migration: 0021_auth_enhancements.sql
-- Description: Adds RPCs for checking super_admin bootstrap and logging security events,
--              plus seeds the admin-promoted email template.
-- =============================================================================

-- 1. Check if the Super Admin needs to bootstrap their password
-- Returns TRUE if a super_admin exists with the given email and has NEVER logged in.
-- Returns FALSE otherwise.
CREATE OR REPLACE FUNCTION public.check_bootstrap_status(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT u.last_sign_in_at INTO v_user
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE u.email = p_email AND p.role = 'super_admin';

  IF FOUND THEN
    -- If last_sign_in_at is NULL, bootstrap is needed
    RETURN v_user.last_sign_in_at IS NULL;
  END IF;

  RETURN FALSE;
END;
$$;

-- 2. Log security events safely from the client
-- This allows tracking failed logins or other anomalous behavior without full backend.
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type TEXT, p_email TEXT, p_metadata JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to resolve user_id if email exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Insert into activity_logs
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    metadata
  ) VALUES (
    v_user_id,
    p_event_type,
    jsonb_build_object(
      'email', p_email,
      'client_metadata', p_metadata,
      'logged_at', now()
    )
  );

  -- If it's a critical security alert (like repeated failed logins), queue an admin notification
  IF p_event_type = 'security_alert' THEN
    INSERT INTO public.communication_events (
      event_type,
      channel,
      priority,
      payload
    ) VALUES (
      'admin.security_alert',
      'email',
      'high',
      jsonb_build_object(
        'category', 'admin',
        'template_slug', 'admin-notification',
        'recipient_email', 'admin@universeicos.app', -- We could pull this dynamically, hardcoded for safety fallback
        'template_data', jsonb_build_object(
          'alert', p_metadata->>'reason',
          'email', p_email
        )
      )
    );
  END IF;
END;
$$;

-- 3. Utility to safely resolve a user ID by email for admin edge functions
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  RETURN v_user_id;
END;
$$;

-- 4. Seed admin-promoted email template
INSERT INTO public.email_templates (name, slug, subject, category, priority, component_name, is_system)
VALUES (
  'Admin Promoted',
  'admin-promoted',
  'You have been promoted to Admin on Universe',
  'auth',
  'high',
  'AdminPromotedEmail',
  TRUE
) ON CONFLICT (slug) DO NOTHING;
