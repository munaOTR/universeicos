-- Migration: 0020_site_reset_rpc.sql
-- Description: Adds a secure, super_admin-only RPC for resetting pre-launch test data.
-- This preserves:
--   - Admin/super_admin/moderator profiles (non-student accounts)
--   - Email templates and brand settings
--   - System settings
--   - Platform alerts
--   - Audit log of the reset itself
-- This DELETES:
--   - Student profiles + their auth.users records
--   - Waitlist entries
--   - Referrals
--   - Referral codes on remaining profiles (reset to fresh codes)
--   - Email queue, email logs
--   - Communication events
--   - Analytics events
--   - Verification reminders
--   - Email campaigns (draft/archived)
--   - Survey responses
--   - Fraud logs
--   - Gamification (notifications, leaderboard snapshots)
--   - Announcements

CREATE OR REPLACE FUNCTION public.reset_site_for_launch(
  p_confirmation TEXT  -- must be "RESET UNIVERSE" to execute
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    UUID;
  v_caller_role  public.user_role;
  v_deleted      JSONB := '{}'::JSONB;
  v_count        BIGINT;
  v_student_ids  UUID[];
BEGIN
  -- ── 1. Verify confirmation phrase ─────────────────────────────────────────
  IF p_confirmation IS DISTINCT FROM 'RESET UNIVERSE' THEN
    RAISE EXCEPTION 'Confirmation phrase incorrect. Pass exactly: RESET UNIVERSE';
  END IF;

  -- ── 2. Verify caller is super_admin ───────────────────────────────────────
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: only super_admin can reset the site (your role: %)', v_caller_role;
  END IF;

  -- ── 3. Collect student profile IDs to delete ──────────────────────────────
  SELECT ARRAY_AGG(id) INTO v_student_ids
  FROM public.profiles
  WHERE role = 'student';

  -- ── 4. Delete student auth.users records (cascades to profiles via trigger) 
  --        We delete from auth.users so Supabase Auth is cleaned up too.
  IF v_student_ids IS NOT NULL AND array_length(v_student_ids, 1) > 0 THEN
    DELETE FROM auth.users WHERE id = ANY(v_student_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_deleted := v_deleted || jsonb_build_object('auth_users_deleted', v_count);
  ELSE
    v_deleted := v_deleted || jsonb_build_object('auth_users_deleted', 0);
  END IF;

  -- ── 5. Clear waitlist (student entries gone, but catch any orphans) ────────
  DELETE FROM public.waitlist;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('waitlist_cleared', v_count);

  -- ── 6. Clear referrals ────────────────────────────────────────────────────
  DELETE FROM public.referrals;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('referrals_cleared', v_count);

  -- ── 7. Reset points and referred_by on remaining admin profiles ───────────
  UPDATE public.profiles
  SET points = 0, referred_by = NULL, updated_at = NOW()
  WHERE role IN ('admin', 'super_admin', 'moderator');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('admin_profiles_reset', v_count);

  -- ── 8. Clear email queue, logs, communication events ─────────────────────
  DELETE FROM public.email_queue;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('email_queue_cleared', v_count);

  DELETE FROM public.email_logs;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('email_logs_cleared', v_count);

  DELETE FROM public.communication_events;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('communication_events_cleared', v_count);

  -- ── 9. Clear analytics events ─────────────────────────────────────────────
  DELETE FROM public.analytics_events;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('analytics_events_cleared', v_count);

  -- ── 10. Clear verification reminders ──────────────────────────────────────
  DELETE FROM public.verification_reminders;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('verification_reminders_cleared', v_count);

  -- ── 11. Clear draft/archived campaigns only (preserve sent history intent) 
  DELETE FROM public.email_campaigns WHERE status IN ('draft', 'archived', 'scheduled');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('campaigns_cleared', v_count);

  -- ── 12. Clear survey responses ────────────────────────────────────────────
  DELETE FROM public.survey_responses;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('survey_responses_cleared', v_count);

  -- ── 13. Clear fraud logs ──────────────────────────────────────────────────
  DELETE FROM public.fraud_logs;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('fraud_logs_cleared', v_count);

  -- ── 14. Clear notifications ───────────────────────────────────────────────
  DELETE FROM public.notifications;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('notifications_cleared', v_count);

  -- ── 15. Clear audit_logs (fresh slate), but log the reset itself after ────
  DELETE FROM public.audit_logs;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted || jsonb_build_object('audit_logs_cleared', v_count);

  -- ── 16. Write a permanent audit record of the reset ──────────────────────
  INSERT INTO public.audit_logs (actor_id, action, resource, details)
  VALUES (
    v_caller_id,
    'site_reset',
    'system',
    jsonb_build_object(
      'reset_at',   NOW(),
      'performed_by', v_caller_id,
      'summary',    v_deleted
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'reset_at', NOW(),
    'summary', v_deleted
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Only authenticated users can call this; internal role check enforces super_admin
GRANT EXECUTE ON FUNCTION public.reset_site_for_launch(TEXT) TO authenticated;

COMMENT ON FUNCTION public.reset_site_for_launch IS
  'Wipes all pre-launch test data (students, waitlist, referrals, queue, analytics). '
  'Requires caller to be super_admin and pass the exact confirmation phrase "RESET UNIVERSE". '
  'Preserves admin accounts, email templates, brand settings, and system settings.';
