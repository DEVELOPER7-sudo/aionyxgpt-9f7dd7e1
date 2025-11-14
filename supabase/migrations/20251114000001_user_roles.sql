-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
-- Users can view their own roles
CREATE POLICY user_roles_select ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- Only admins can insert/update/delete roles (except users can't modify their own)
CREATE POLICY user_roles_insert ON user_roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY user_roles_update ON user_roles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY user_roles_delete ON user_roles FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(role TEXT) AS $$
BEGIN
  IF target_user_id IS NULL THEN
    target_user_id := auth.uid();
  END IF;
  
  -- Only allow users to view their own roles, admins can view anyone's
  IF auth.uid() != target_user_id AND NOT has_role('admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT user_roles.role FROM user_roles WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add role to user
CREATE OR REPLACE FUNCTION add_user_role(target_user_id UUID, role_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Only admins can add roles
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can add roles';
  END IF;
  
  INSERT INTO user_roles (user_id, role) 
  VALUES (target_user_id, role_name)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to remove role from user
CREATE OR REPLACE FUNCTION remove_user_role(target_user_id UUID, role_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Only admins can remove roles
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  DELETE FROM user_roles 
  WHERE user_id = target_user_id AND role = role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
