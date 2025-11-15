-- Create enum type for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'premium');

-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- Create indexes for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own roles
CREATE POLICY user_roles_select ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Only allow viewing roles (no INSERT/UPDATE/DELETE via direct table access)
-- Admin operations must go through the secure functions below

-- Create SECURITY DEFINER function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user roles (admins can view any user, users can view their own)
CREATE OR REPLACE FUNCTION public.get_user_roles(_target_user_id uuid DEFAULT NULL)
RETURNS TABLE(role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_roles.role 
  FROM public.user_roles 
  WHERE user_id = COALESCE(_target_user_id, auth.uid())
    AND (
      auth.uid() = COALESCE(_target_user_id, auth.uid()) 
      OR public.has_role(auth.uid(), 'admin')
    )
$$;

-- Create function to add role to user (admin only)
CREATE OR REPLACE FUNCTION public.add_user_role(_target_user_id uuid, _role_name public.app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can add roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can add roles';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (_target_user_id, _role_name)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Create function to remove role from user (admin only)
CREATE OR REPLACE FUNCTION public.remove_user_role(_target_user_id uuid, _role_name public.app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can remove roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  DELETE FROM public.user_roles 
  WHERE user_id = _target_user_id AND role = _role_name;
END;
$$;