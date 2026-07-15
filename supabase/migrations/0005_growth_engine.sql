-- Migration: 0005_growth_engine.sql
-- Description: Creates the gamification and fraud detection schema for the Growth Engine.

-- ── 1. Badges ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admins can manage badges, users can view badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are viewable by everyone" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ── 2. User Badges ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Users can view their own badges, admins can manage all
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user badges" ON public.user_badges FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ── 3. Rewards ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admins can manage rewards, users can view rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rewards are viewable by everyone" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Admins can manage rewards" ON public.rewards FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ── 4. User Rewards ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  UNIQUE(user_id, reward_id)
);

-- Users can view and claim their own rewards
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own rewards (claim)" ON public.user_rewards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user rewards" ON public.user_rewards FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ── 5. Fraud Logs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only admins can view fraud logs
ALTER TABLE public.fraud_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view fraud logs" ON public.fraud_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ── 6. Update Handle New User Trigger for Fraud ─────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_referral_code TEXT;
  code_exists BOOLEAN;
  referrer_user_id UUID;
BEGIN
  -- 1. Generate a unique referral code loop
  LOOP
    new_referral_code := public.generate_referral_code();
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code
    ) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- 2. Insert into profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    university,
    avatar_url,
    referral_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'university',
    NEW.raw_user_meta_data->>'avatar_url',
    new_referral_code
  );

  -- 3. Process referral if applicable
  IF NEW.raw_user_meta_data->>'ref' IS NOT NULL THEN
    -- Look up the referrer's user ID from the profile table
    SELECT id INTO referrer_user_id
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'ref'
    LIMIT 1;

    IF referrer_user_id IS NOT NULL THEN
      -- Fraud check: Prevent self-referral
      IF referrer_user_id = NEW.id THEN
        INSERT INTO public.fraud_logs (user_id, reason, metadata)
        VALUES (NEW.id, 'self_referral_attempt', jsonb_build_object('ref_code', NEW.raw_user_meta_data->>'ref'));
      ELSE
        -- Insert into referrals table
        INSERT INTO public.referrals (referrer_id, referred_id, status)
        VALUES (referrer_user_id, NEW.id, 'completed')
        ON CONFLICT DO NOTHING;

        -- Award points to referrer atomically
        UPDATE public.profiles
           SET points = points + 100
         WHERE id = referrer_user_id;
      END IF;
    END IF;
  END IF;

  -- 4. Insert into waitlist table
  INSERT INTO public.waitlist (
    user_id,
    faculty,
    department,
    phone,
    graduation_year,
    newsletter_consent,
    terms_accepted_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'faculty',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'graduation_year',
    (NEW.raw_user_meta_data->>'newsletter_consent')::BOOLEAN,
    (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ
  );

  RETURN NEW;
END;
$$;
