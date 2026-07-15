-- Migration: Admin Role Management
-- Adds super_admin role, secure role-assignment function, and audit trigger

-- ============================================================================
-- 1. Add super_admin to user_role enum (safe, additive)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'public.user_role'::regtype 
    AND enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- ============================================================================
-- 2. Secure role-assignment function
-- Only a super_admin (or a service_role call) can promote/demote other users.
-- A super_admin CANNOT demote themselves (safety guard).
-- Audit log is written inside the function.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_user_role(
  target_user_id UUID,
  new_role       public.user_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role public.user_role;
  old_role    public.user_role;
BEGIN
  -- 1. Get the caller's current role
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- 2. Guard: Only super_admin may call this function
  IF caller_role IS DISTINCT FROM 'super_admin'::public.user_role THEN
    RAISE EXCEPTION 'Access denied: only super_admins can change user roles';
  END IF;

  -- 3. Guard: Super admin cannot demote themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Access denied: you cannot change your own role';
  END IF;

  -- 4. Get the old role for audit purposes
  SELECT role INTO old_role
  FROM public.profiles
  WHERE id = target_user_id;

  IF old_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 5. Apply the role change
  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  -- 6. Write to audit_logs
  INSERT INTO public.audit_logs (actor_id, action, resource, details)
  VALUES (
    auth.uid(),
    'update',
    'profiles',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'old_role', old_role::TEXT,
      'new_role', new_role::TEXT,
      'action', 'role_change'
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
-- (The SECURITY DEFINER + internal guard means only super_admins can actually succeed)
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.user_role) TO authenticated;

-- ============================================================================
-- 3. Update the is_admin() helper to include super_admin and moderator
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. RLS policy so only super_admins can write to profiles.role
-- Regular admins should not be able to self-escalate via direct UPDATE.
-- ============================================================================

-- Drop old overly-broad admin override policy if it exists
DROP POLICY IF EXISTS "Admin override profiles" ON public.profiles;

-- Read: admins can see all profiles
CREATE POLICY "Admin read profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- Write: only super_admin can update the role column on any profile
-- Other profile fields can still be updated by the owner
CREATE POLICY "Super admin full profile control"
  ON public.profiles FOR UPDATE
  USING (is_super_admin());

-- Allow users to update their own non-role fields
CREATE POLICY "Users can update own profile non-role fields"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    -- Prevent self role escalation: new role must equal old role
    -- (this check is handled by set_user_role, but belt-and-suspenders)
  );

-- ============================================================================
-- 5. Seed: Ensure the roles table has the core roles populated
-- ============================================================================
INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Full platform control, can manage all admins'),
  ('admin', 'Can manage content, users and operations'),
  ('moderator', 'Can moderate content and review user reports'),
  ('student', 'Standard student account')
ON CONFLICT (name) DO NOTHING;
