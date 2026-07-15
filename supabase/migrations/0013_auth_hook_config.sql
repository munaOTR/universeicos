-- =============================================================================
-- Migration: 0013_auth_hook_config.sql
-- Description: Configures Supabase Auth to use the Universe comms-auth-hook
--              for all email delivery. This replaces Supabase's built-in
--              email sender with Universe-branded React Email templates via Resend.
--
-- HOW TO ACTIVATE:
-- Option A (Recommended) — Supabase Dashboard:
--   1. Go to: Authentication → Hooks → Send Email Hook
--   2. Set Type: "Supabase Edge Functions"
--   3. Set URI: https://[PROJECT_REF].supabase.co/functions/v1/comms-auth-hook
--   4. Set Secret: (optional signing secret if you want to verify)
--   5. Save.
--
-- Option B — SQL (for local dev / CI):
--   Run the SQL below after enabling the custom hook feature in config.toml.
-- =============================================================================

-- NOTE: Supabase Auth hooks are configured via the dashboard or supabase/config.toml
-- In the local development config.toml, add:
--
-- [auth.hook.send_email]
-- enabled = true
-- uri = "http://host.docker.internal:54321/functions/v1/comms-auth-hook"
--
-- In production, this is configured via the dashboard. The SQL below is
-- documentation only and does not run on cloud Supabase without the feature being enabled.

-- Disable Supabase's built-in SMTP so emails go exclusively through the hook.
-- Only run this once the hook is confirmed working.
-- UPDATE auth.config SET smtp_host = NULL, smtp_user = NULL, smtp_pass = NULL WHERE id = 1;

-- Confirm hook registration (read-only check, not an actual config statement):
SELECT 'Auth hook must be configured via Dashboard > Authentication > Hooks' AS notice;
