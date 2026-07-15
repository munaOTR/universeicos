-- Phase 2A: Core Schema (Users, Waitlist, Referrals)

-- 1. Create custom enums
CREATE TYPE user_role AS ENUM ('student', 'admin', 'moderator');
CREATE TYPE waitlist_status AS ENUM ('pending', 'verified', 'approved', 'rejected');
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'flagged');

-- 2. Create the users table extending auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  university TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  waitlist_position INTEGER,
  points INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create the waitlist table
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  university TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  position SERIAL,
  status waitlist_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create the referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status referral_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (referred_id) -- A user can only be referred once
);

-- 5. Function to generate a random 8-character referral code
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql VOLATILE;

-- 6. Trigger function to handle new auth users and create public records
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
DECLARE
  new_referral_code TEXT;
  referrer_user_id UUID;
BEGIN
  -- Generate unique referral code
  new_referral_code := generate_referral_code();
  WHILE EXISTS (SELECT 1 FROM public.users WHERE referral_code = new_referral_code) LOOP
    new_referral_code := generate_referral_code();
  END LOOP;

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    university,
    referral_code,
    referred_by
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'university',
    new_referral_code,
    NEW.raw_user_meta_data->>'ref'
  );

  -- Insert into public.waitlist
  INSERT INTO public.waitlist (
    user_id,
    email,
    full_name,
    university,
    referral_code,
    referred_by,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'university',
    new_referral_code,
    NEW.raw_user_meta_data->>'ref',
    'verified' -- if they reached here, their email is verified via Magic Link
  );

  -- Process referral if applicable
  IF NEW.raw_user_meta_data->>'ref' IS NOT NULL THEN
    SELECT id INTO referrer_user_id FROM public.users WHERE referral_code = NEW.raw_user_meta_data->>'ref';
    IF referrer_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id, status)
      VALUES (referrer_user_id, NEW.id, 'completed');
      
      -- Award points to referrer (e.g., 100 points)
      UPDATE public.users SET points = points + 100 WHERE id = referrer_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
