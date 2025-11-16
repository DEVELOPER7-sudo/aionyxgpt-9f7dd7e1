import { supabase } from '../../integrations/supabase/client';
import { SharedChat, MessageComment } from '../../types/features';
import * as bcrypt from 'bcryptjs';

// ============================================================
// CHAT SHARING
// ============================================================

export const createShareLink = async (
  chatId: string,
  creatorId: string,
  options?: {
    expiresInDays?: number;
    password?: string;
    accessLevel?: 'view' | 'comment' | 'edit';
  }
): Promise<SharedChat> => {
  const token = generateShareToken();
  let passwordHash: string | undefined;

  if (options?.password) {
    // In production, use bcrypt. For now, use simple hashing
    passwordHash = btoa(options.password);
  }

  const expiresAt = options?.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const { data, error } = await supabase
    .from('shared_chats')
    .insert({
      chat_id: chatId,
      creator_id: creatorId,
      token,
      password_hash: passwordHash,
      expires_at: expiresAt?.toISOString(),
      access_level: options?.accessLevel || 'view',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create share link: ${error.message}`);
  return data;
};

export const getShareLink = async (token: string, password?: string): Promise<SharedChat | null> => {
  const { data, error } = await supabase
    .from('shared_chats')
    .select('*')
    .eq('token', token)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch share link: ${error.message}`);
  }

  if (!data) return null;

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Check password
  if (data.password_hash && password !== atob(data.password_hash)) {
    return null;
  }

  // Log access
  await logShareAccess(data.id);

  return data;
};

export const updateShareLink = async (
  shareId: string,
  updates: Partial<SharedChat>
): Promise<SharedChat> => {
  const { data, error } = await supabase
    .from('shared_chats')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', shareId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update share link: ${error.message}`);
  return data;
};

export const revokeShareLink = async (shareId: string): Promise<void> => {
  const { error } = await supabase.from('shared_chats').delete().eq('id', shareId);

  if (error) throw new Error(`Failed to revoke share link: ${error.message}`);
};

export const getUserShareLinks = async (userId: string): Promise<SharedChat[]> => {
  const { data, error } = await supabase
    .from('shared_chats')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch share links: ${error.message}`);
  return data || [];
};

// ============================================================
// ACCESS LOGGING
// ============================================================

export const logShareAccess = async (shareId: string, userId?: string): Promise<void> => {
  const { error } = await supabase.from('share_access_logs').insert({
    share_id: shareId,
    accessed_by: userId,
    ip_address: await getClientIp(),
  });

  if (error) throw new Error(`Failed to log access: ${error.message}`);
};

export const getShareAccessLogs = async (shareId: string) => {
  const { data, error } = await supabase
    .from('share_access_logs')
    .select('*')
    .eq('share_id', shareId)
    .order('accessed_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch access logs: ${error.message}`);
  return data || [];
};

// ============================================================
// COMMENTS & ANNOTATIONS
// ============================================================

export const addComment = async (
  messageId: string,
  authorId: string,
  content: string,
  parentCommentId?: string
): Promise<MessageComment> => {
  const { data, error } = await supabase
    .from('message_comments')
    .insert({
      message_id: messageId,
      author_id: authorId,
      content,
      parent_comment_id: parentCommentId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add comment: ${error.message}`);
  return data;
};

export const getMessageComments = async (messageId: string): Promise<MessageComment[]> => {
  const { data, error } = await supabase
    .from('message_comments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch comments: ${error.message}`);
  return data || [];
};

export const getCommentThread = async (parentCommentId: string): Promise<MessageComment[]> => {
  const { data, error } = await supabase
    .from('message_comments')
    .select('*')
    .eq('parent_comment_id', parentCommentId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch comment thread: ${error.message}`);
  return data || [];
};

export const updateComment = async (
  commentId: string,
  content: string
): Promise<MessageComment> => {
  const { data, error } = await supabase
    .from('message_comments')
    .update({
      content,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update comment: ${error.message}`);
  return data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  // Delete reactions first
  await supabase.from('comment_reactions').delete().eq('comment_id', commentId);

  // Delete comment
  const { error } = await supabase.from('message_comments').delete().eq('id', commentId);

  if (error) throw new Error(`Failed to delete comment: ${error.message}`);
};

// ============================================================
// COMMENT REACTIONS
// ============================================================

export const addCommentReaction = async (
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  const { error } = await supabase.from('comment_reactions').insert({
    comment_id: commentId,
    user_id: userId,
    emoji,
  });

  if (error && error.code !== '23505') {
    // Ignore duplicate reactions
    throw new Error(`Failed to add reaction: ${error.message}`);
  }
};

export const removeCommentReaction = async (
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  const { error } = await supabase
    .from('comment_reactions')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw new Error(`Failed to remove reaction: ${error.message}`);
};

export const getCommentReactions = async (commentId: string) => {
  const { data, error } = await supabase
    .from('comment_reactions')
    .select('*')
    .eq('comment_id', commentId);

  if (error) throw new Error(`Failed to fetch reactions: ${error.message}`);

  // Group by emoji
  const grouped: Record<string, string[]> = {};
  for (const reaction of data || []) {
    if (!grouped[reaction.emoji]) {
      grouped[reaction.emoji] = [];
    }
    grouped[reaction.emoji].push(reaction.user_id);
  }

  return grouped;
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function getClientIp(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return null;
  }
}
