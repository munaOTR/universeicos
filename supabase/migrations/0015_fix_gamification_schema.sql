-- =============================================================================
-- Migration: 0015_fix_gamification_schema.sql
-- Description: Fixes schema discrepancies in badges and rewards tables
--              caused by IF NOT EXISTS conflicts between 0002 and 0005 migrations.
-- =============================================================================

-- 1. Fix `rewards` table
-- 0002 used `points_cost`, 0005 expected `points_required` and `icon`.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'points_cost'
  ) THEN
    ALTER TABLE public.rewards RENAME COLUMN points_cost TO points_required;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN icon TEXT;
  END IF;
END $$;

-- 2. Fix `badges` table
-- 0002 used `icon_url`, 0005 expected `image_url` and `criteria`.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'icon_url'
  ) THEN
    ALTER TABLE public.badges RENAME COLUMN icon_url TO image_url;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'badges' AND column_name = 'criteria'
  ) THEN
    ALTER TABLE public.badges ADD COLUMN criteria JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;
