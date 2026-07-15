-- ── 6. Admin Analytics & Stats Functions ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_queue_stats()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pending INT;
  v_processing INT;
  v_retrying INT;
  v_dead_letter INT;
  v_delivered INT;
  v_failed INT;
BEGIN
  -- We count by status
  SELECT count(*) INTO v_pending FROM public.email_queue WHERE status = 'pending';
  SELECT count(*) INTO v_processing FROM public.email_queue WHERE status = 'processing';
  SELECT count(*) INTO v_retrying FROM public.email_queue WHERE status = 'retrying';
  SELECT count(*) INTO v_dead_letter FROM public.email_queue WHERE status = 'dead_letter';
  SELECT count(*) INTO v_delivered FROM public.email_queue WHERE status = 'delivered';
  SELECT count(*) INTO v_failed FROM public.email_queue WHERE status = 'failed';

  RETURN jsonb_build_object(
    'pending', v_pending,
    'processing', v_processing,
    'retrying', v_retrying,
    'dead_letter', v_dead_letter,
    'delivered', v_delivered,
    'failed', v_failed
  );
END;
$$;
