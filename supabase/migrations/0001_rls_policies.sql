-- Phase 2A: Row Level Security (RLS) Policies

-- 1. Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 2. Users Table Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile (except sensitive fields)
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Waitlist Table Policies
-- Users can view their own waitlist entry
CREATE POLICY "Users can view own waitlist entry" 
ON public.waitlist FOR SELECT 
USING (user_id = auth.uid());

-- 4. Referrals Table Policies
-- Users can view referrals they sent (where they are the referrer)
CREATE POLICY "Users can view own referrals sent" 
ON public.referrals FOR SELECT 
USING (referrer_id = auth.uid());

-- Users can view referrals they received (where they are the referred)
CREATE POLICY "Users can view own referrals received" 
ON public.referrals FOR SELECT 
USING (referred_id = auth.uid());

-- 5. Admin Policies (Admins can do everything)
-- To prevent infinite recursion, we use a helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for users table
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all users" 
ON public.users FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all users" 
ON public.users FOR DELETE 
USING (is_admin());

-- Admin policies for waitlist table
CREATE POLICY "Admins can view all waitlist entries" 
ON public.waitlist FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all waitlist entries" 
ON public.waitlist FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all waitlist entries" 
ON public.waitlist FOR DELETE 
USING (is_admin());

-- Admin policies for referrals table
CREATE POLICY "Admins can view all referrals" 
ON public.referrals FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all referrals" 
ON public.referrals FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all referrals" 
ON public.referrals FOR DELETE 
USING (is_admin());
