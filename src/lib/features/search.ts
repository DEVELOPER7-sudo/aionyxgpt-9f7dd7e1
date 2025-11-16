import { supabase } from '../../integrations/supabase/client';
import { SearchFilters, SearchResult } from '../../types/features';

// ============================================================
// CHAT SEARCH
// ============================================================

export const searchChats = async (userId: string, filters: SearchFilters): Promise<SearchResult[]> => {
  let query = supabase.from('chats').select('*').eq('user_id', userId);

  // Text search across content
  if (filters.query) {
    // Use Postgres full-text search
    query = query.textSearch('content', filters.query, {
      type: 'websearch',
      config: 'english',
    });
  }

  // Filter by model
  if (filters.model) {
    query = query.eq('model', filters.model);
  }

  // Date range filtering
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  // Filter by collection/tags
  if (filters.tags && filters.tags.length > 0) {
    query = query.in('tags', filters.tags);
  }

  // Only bookmarked
  if (filters.hasBookmark) {
    // This would need a join with bookmarks table
    query = query.in('id', await getBookmarkedChatIds(userId));
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Search failed: ${error.message}`);

  return (data || []).map((chat) => ({
    chat_id: chat.id,
    message_id: chat.id,
    content: chat.content,
    model: chat.model,
    created_at: chat.created_at,
  }));
};

export const getBookmarkedChatIds = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('chat_id')
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to fetch bookmarked chats: ${error.message}`);
  return (data || []).map((b) => b.chat_id);
};

// ============================================================
// ADVANCED SEARCH WITH FILTERS
// ============================================================

interface SearchOptions {
  query?: string;
  models?: string[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  collections?: string[];
  onlyBookmarked?: boolean;
  limit?: number;
  offset?: number;
}

export const advancedSearch = async (userId: string, options: SearchOptions) => {
  let query = supabase
    .from('chats')
    .select(
      `
      *,
      chat_metadata(model, total_tokens),
      chat_tag_mapping(chat_tags(*))
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId);

  // Text search
  if (options.query && options.query.trim()) {
    query = query.textSearch('content', options.query, {
      type: 'websearch',
    });
  }

  // Model filter
  if (options.models && options.models.length > 0) {
    query = query.in('model', options.models);
  }

  // Date range
  if (options.dateFrom) {
    query = query.gte('created_at', new Date(options.dateFrom).toISOString());
  }
  if (options.dateTo) {
    query = query.lte('created_at', new Date(options.dateTo).toISOString());
  }

  // Pagination
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(`Advanced search failed: ${error.message}`);

  return {
    results: data || [],
    total: count || 0,
    limit,
    offset,
  };
};

// ============================================================
// SEARCH SUGGESTIONS
// ============================================================

export const getSearchSuggestions = async (userId: string, prefix: string) => {
  // Get recent models
  const { data: models } = await supabase
    .from('chat_metadata')
    .select('model')
    .eq('user_id', userId)
    .distinct()
    .limit(10);

  // Get tags
  const { data: tags } = await supabase
    .from('chat_tags')
    .select('name')
    .eq('created_by', userId)
    .ilike('name', `${prefix}%`)
    .limit(10);

  return {
    models: models?.map((m) => m.model).filter((m) => m) || [],
    tags: tags?.map((t) => t.name) || [],
  };
};

// ============================================================
// SEARCH HISTORY
// ============================================================

interface SearchQuery {
  id: string;
  userId: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  createdAt: string;
}

// Store in localStorage for now (could use Supabase later)
export const saveSearchQuery = (userId: string, query: string, filters: SearchFilters): void => {
  const key = `search_history_${userId}`;
  const history: SearchQuery[] = JSON.parse(localStorage.getItem(key) || '[]');

  history.unshift({
    id: Date.now().toString(),
    userId,
    query,
    filters,
    resultCount: 0,
    createdAt: new Date().toISOString(),
  });

  // Keep only last 50
  localStorage.setItem(key, JSON.stringify(history.slice(0, 50)));
};

export const getSearchHistory = (userId: string): SearchQuery[] => {
  const key = `search_history_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const clearSearchHistory = (userId: string): void => {
  const key = `search_history_${userId}`;
  localStorage.removeItem(key);
};
