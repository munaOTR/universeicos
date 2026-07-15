-- Migration: 0006_fix_waitlist_trigger.sql
-- Description: Safely casts JSON metadata in handle_new_user() to prevent transaction aborts from empty strings.

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

  -- 2. Insert into profiles with safe typecasts
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
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'university', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    new_referral_code
  );

  -- 3. Process referral if applicable
  IF NULLIF(NEW.raw_user_meta_data->>'ref', '') IS NOT NULL THEN
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

  -- 4. Insert into waitlist table with safe typecasts
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
    NULLIF(NEW.raw_user_meta_data->>'faculty', ''),
    NULLIF(NEW.raw_user_meta_data->>'department', ''),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'graduation_year', '')::SMALLINT,
    COALESCE((NULLIF(NEW.raw_user_meta_data->>'newsletter_consent', ''))::BOOLEAN, FALSE),
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::TIMESTAMPTZ
  );

  RETURN NEW;
END;
$$;
