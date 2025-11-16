import { supabase } from '../../integrations/supabase/client';
import { ChatCollection, CollectionItem, ChatTag } from '../../types/features';

// ============================================================
// COLLECTION OPERATIONS
// ============================================================

export const createCollection = async (
  workspaceId: string,
  userId: string,
  name: string,
  color: string = '#808080',
  parentId?: string
): Promise<ChatCollection> => {
  const { data, error } = await supabase
    .from('chat_collections')
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name,
      color,
      parent_id: parentId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create collection: ${error.message}`);
  return data;
};

export const getCollections = async (workspaceId: string): Promise<ChatCollection[]> => {
  const { data, error } = await supabase
    .from('chat_collections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch collections: ${error.message}`);
  return data || [];
};

export const getCollectionHierarchy = async (
  workspaceId: string
): Promise<ChatCollection[]> => {
  const collections = await getCollections(workspaceId);

  // Build tree structure
  const root = collections.filter((c) => !c.parent_id);
  const children: Record<string, ChatCollection[]> = {};

  for (const collection of collections) {
    if (collection.parent_id) {
      if (!children[collection.parent_id]) {
        children[collection.parent_id] = [];
      }
      children[collection.parent_id].push(collection);
    }
  }

  return root;
};

export const updateCollection = async (
  collectionId: string,
  updates: Partial<ChatCollection>
): Promise<ChatCollection> => {
  const { data, error } = await supabase
    .from('chat_collections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', collectionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update collection: ${error.message}`);
  return data;
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_collections')
    .delete()
    .eq('id', collectionId);

  if (error) throw new Error(`Failed to delete collection: ${error.message}`);
};

// ============================================================
// COLLECTION ITEM OPERATIONS
// ============================================================

export const addChatToCollection = async (
  collectionId: string,
  chatId: string,
  position: number = 0
): Promise<CollectionItem> => {
  // Remove from other collections first
  await supabase.from('collection_items').delete().eq('chat_id', chatId);

  const { data, error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      chat_id: chatId,
      position,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add chat to collection: ${error.message}`);
  return data;
};

export const removeChatFromCollection = async (chatId: string): Promise<void> => {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('chat_id', chatId);

  if (error) throw new Error(`Failed to remove chat from collection: ${error.message}`);
};

export const getCollectionChats = async (collectionId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('collection_items')
    .select('chat_id')
    .eq('collection_id', collectionId)
    .order('position', { ascending: true });

  if (error) throw new Error(`Failed to fetch collection chats: ${error.message}`);
  return (data || []).map((item) => item.chat_id);
};

export const reorderCollectionItems = async (
  collectionId: string,
  chatIds: string[]
): Promise<void> => {
  const updates = chatIds.map((chatId, position) => ({
    collection_id: collectionId,
    chat_id: chatId,
    position,
  }));

  for (const update of updates) {
    await supabase
      .from('collection_items')
      .update({ position: update.position })
      .eq('collection_id', update.collection_id)
      .eq('chat_id', update.chat_id);
  }
};

// ============================================================
// TAG OPERATIONS
// ============================================================

export const createTag = async (
  workspaceId: string,
  userId: string,
  name: string,
  color: string = '#808080'
): Promise<ChatTag> => {
  const { data, error } = await supabase
    .from('chat_tags')
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name,
      color,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('Tag with this name already exists');
    }
    throw new Error(`Failed to create tag: ${error.message}`);
  }
  return data;
};

export const getTags = async (workspaceId: string): Promise<ChatTag[]> => {
  const { data, error } = await supabase
    .from('chat_tags')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch tags: ${error.message}`);
  return data || [];
};

export const updateTag = async (tagId: string, updates: Partial<ChatTag>): Promise<ChatTag> => {
  const { data, error } = await supabase
    .from('chat_tags')
    .update(updates)
    .eq('id', tagId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update tag: ${error.message}`);
  return data;
};

export const deleteTag = async (tagId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_tags')
    .delete()
    .eq('id', tagId);

  if (error) throw new Error(`Failed to delete tag: ${error.message}`);
};

// ============================================================
// TAG MAPPING OPERATIONS
// ============================================================

export const addTagToChat = async (chatId: string, tagId: string): Promise<void> => {
  const { error } = await supabase.from('chat_tag_mapping').insert({
    chat_id: chatId,
    tag_id: tagId,
  });

  if (error && error.code !== '23505') {
    // Ignore duplicate inserts
    throw new Error(`Failed to add tag to chat: ${error.message}`);
  }
};

export const removeTagFromChat = async (chatId: string, tagId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_tag_mapping')
    .delete()
    .eq('chat_id', chatId)
    .eq('tag_id', tagId);

  if (error) throw new Error(`Failed to remove tag from chat: ${error.message}`);
};

export const getChatTags = async (chatId: string): Promise<ChatTag[]> => {
  const { data, error } = await supabase
    .from('chat_tag_mapping')
    .select('chat_tags(*)')
    .eq('chat_id', chatId);

  if (error) throw new Error(`Failed to fetch chat tags: ${error.message}`);
  return (data || []).map((item) => item.chat_tags);
};

export const getChatsWithTag = async (
  workspaceId: string,
  tagId: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from('chat_tag_mapping')
    .select('chat_id')
    .eq('tag_id', tagId);

  if (error) throw new Error(`Failed to fetch chats with tag: ${error.message}`);
  return (data || []).map((item) => item.chat_id);
};

export const updateChatTags = async (chatId: string, tagIds: string[]): Promise<void> => {
  // Remove all existing tags
  await supabase.from('chat_tag_mapping').delete().eq('chat_id', chatId);

  // Add new tags
  if (tagIds.length > 0) {
    const mappings = tagIds.map((tagId) => ({
      chat_id: chatId,
      tag_id: tagId,
    }));

    const { error } = await supabase.from('chat_tag_mapping').insert(mappings);

    if (error) throw new Error(`Failed to update chat tags: ${error.message}`);
  }
};
