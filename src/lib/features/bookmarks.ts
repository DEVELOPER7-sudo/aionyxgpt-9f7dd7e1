import { supabase } from '../../integrations/supabase/client';
import { Bookmark, BookmarkFolder } from '../../types/features';

// ============================================================
// BOOKMARK FOLDER OPERATIONS
// ============================================================

export const createBookmarkFolder = async (
  userId: string,
  workspaceId: string,
  name: string,
  color: string = '#808080'
): Promise<BookmarkFolder> => {
  const { data, error } = await supabase
    .from('bookmark_folders')
    .insert({
      user_id: userId,
      workspace_id: workspaceId,
      name,
      color,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create bookmark folder: ${error.message}`);
  return data;
};

export const getBookmarkFolders = async (
  userId: string,
  workspaceId: string
): Promise<BookmarkFolder[]> => {
  const { data, error } = await supabase
    .from('bookmark_folders')
    .select('*')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch bookmark folders: ${error.message}`);
  return data || [];
};

export const updateBookmarkFolder = async (
  folderId: string,
  updates: Partial<BookmarkFolder>
): Promise<BookmarkFolder> => {
  const { data, error } = await supabase
    .from('bookmark_folders')
    .update(updates)
    .eq('id', folderId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update bookmark folder: ${error.message}`);
  return data;
};

export const deleteBookmarkFolder = async (folderId: string): Promise<void> => {
  const { error } = await supabase
    .from('bookmark_folders')
    .delete()
    .eq('id', folderId);

  if (error) throw new Error(`Failed to delete bookmark folder: ${error.message}`);
};

// ============================================================
// BOOKMARK OPERATIONS
// ============================================================

export const addBookmark = async (
  userId: string,
  messageId: string,
  folderId?: string,
  note?: string
): Promise<Bookmark> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      message_id: messageId,
      folder_id: folderId,
      note,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add bookmark: ${error.message}`);
  return data;
};

export const removeBookmark = async (messageId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to remove bookmark: ${error.message}`);
};

export const getBookmarks = async (userId: string): Promise<Bookmark[]> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch bookmarks: ${error.message}`);
  return data || [];
};

export const getBookmarksByFolder = async (
  folderId: string,
  userId: string
): Promise<Bookmark[]> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('folder_id', folderId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch bookmarks: ${error.message}`);
  return data || [];
};

export const updateBookmark = async (
  bookmarkId: string,
  updates: Partial<Bookmark>
): Promise<Bookmark> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .update(updates)
    .eq('id', bookmarkId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update bookmark: ${error.message}`);
  return data;
};

export const isMessageBookmarked = async (
  messageId: string,
  userId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(`Failed to check bookmark: ${error.message}`);
  }

  return !!data;
};
