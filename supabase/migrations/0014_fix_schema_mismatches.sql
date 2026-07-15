-- =============================================================================
-- Migration: 0014_fix_schema_mismatches.sql
-- Description: Fixes schema discrepancies between the frontend code and the
--              database for campaigns, announcements, and surveys.
-- =============================================================================

-- 1. Fix email_campaigns: `body_template` was set to NOT NULL in 0002 migration.
-- The new schema uses `html_body` and `template_id` instead. We make it nullable.
ALTER TABLE public.email_campaigns
  ALTER COLUMN body_template DROP NOT NULL;

-- 2. Fix announcements: The frontend uses `is_published` instead of just an expiry date.
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Fix surveys: The frontend uses `status` (draft/published/archived) instead of `is_active`.
ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
