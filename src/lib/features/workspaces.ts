import { supabase } from '../../integrations/supabase/client';
import { Workspace, WorkspaceMember, WorkspaceInvite } from '../../types/features';

// ============================================================
// WORKSPACE OPERATIONS
// ============================================================

export const createWorkspace = async (
  userId: string,
  name: string,
  description?: string
): Promise<Workspace> => {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      name,
      owner_id: userId,
      description,
      is_public: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create workspace: ${error.message}`);

  // Add creator as owner
  await addWorkspaceMember(data.id, userId, 'owner');

  return data;
};

export const getWorkspaces = async (userId: string): Promise<Workspace[]> => {
  const { data, error } = await supabase
    .from('workspaces')
    .select(
      `
      *,
      workspace_members!inner(user_id)
    `
    )
    .eq('workspace_members.user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch workspaces: ${error.message}`);
  return data || [];
};

export const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch workspace: ${error.message}`);
  }

  return data || null;
};

export const updateWorkspace = async (
  workspaceId: string,
  updates: Partial<Workspace>
): Promise<Workspace> => {
  const { data, error } = await supabase
    .from('workspaces')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update workspace: ${error.message}`);
  return data;
};

export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);

  if (error) throw new Error(`Failed to delete workspace: ${error.message}`);
};

// ============================================================
// WORKSPACE MEMBER OPERATIONS
// ============================================================

export const addWorkspaceMember = async (
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer' = 'editor'
): Promise<WorkspaceMember> => {
  const { data, error } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add workspace member: ${error.message}`);
  return data;
};

export const getWorkspaceMembers = async (workspaceId: string): Promise<WorkspaceMember[]> => {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch workspace members: ${error.message}`);
  return data || [];
};

export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'editor' | 'viewer'
): Promise<WorkspaceMember> => {
  const { data, error } = await supabase
    .from('workspace_members')
    .update({ role })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update member role: ${error.message}`);
  return data;
};

export const removeWorkspaceMember = async (
  workspaceId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to remove workspace member: ${error.message}`);
};

export const getUserRoleInWorkspace = async (
  workspaceId: string,
  userId: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch user role: ${error.message}`);
  }

  return data?.role || null;
};

// ============================================================
// WORKSPACE INVITE OPERATIONS
// ============================================================

export const createWorkspaceInvite = async (
  workspaceId: string,
  email: string,
  invitedBy: string,
  role: 'admin' | 'editor' | 'viewer' = 'editor',
  expiresInDays: number = 7
): Promise<WorkspaceInvite> => {
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { data, error } = await supabase
    .from('workspace_invites')
    .insert({
      workspace_id: workspaceId,
      email,
      role,
      invited_by: invitedBy,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create invite: ${error.message}`);
  return data;
};

export const getWorkspaceInvites = async (workspaceId: string): Promise<WorkspaceInvite[]> => {
  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch invites: ${error.message}`);
  return data || [];
};

export const acceptWorkspaceInvite = async (
  token: string,
  userId: string
): Promise<Workspace> => {
  // Find and validate invite
  const { data: invite, error: fetchError } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (fetchError) throw new Error('Invalid or expired invite');

  // Add user to workspace
  await addWorkspaceMember(invite.workspace_id, userId, invite.role);

  // Mark invite as used
  await supabase
    .from('workspace_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id);

  // Return workspace
  const workspace = await getWorkspace(invite.workspace_id);
  if (!workspace) throw new Error('Workspace not found');

  return workspace;
};

export const deleteInvite = async (inviteId: string): Promise<void> => {
  const { error } = await supabase.from('workspace_invites').delete().eq('id', inviteId);

  if (error) throw new Error(`Failed to delete invite: ${error.message}`);
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================================
// WORKSPACE PERMISSIONS
// ============================================================

export const canEditWorkspace = (role: string | null): boolean => {
  return role === 'owner' || role === 'admin';
};

export const canManageMembers = (role: string | null): boolean => {
  return role === 'owner' || role === 'admin';
};

export const canDeleteChat = (role: string | null): boolean => {
  return role === 'owner' || role === 'admin' || role === 'editor';
};

export const canViewChat = (role: string | null): boolean => {
  return role !== null;
};
