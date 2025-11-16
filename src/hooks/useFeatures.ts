import { useCallback, useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import * as featuresLib from '@/lib/features';
import { Bookmark, ChatCollection, Workspace } from '@/types/features';

export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await featuresLib.getBookmarks(user.id);
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addBookmark = useCallback(
    async (messageId: string, folderId?: string, note?: string) => {
      if (!user) return;
      try {
        const bookmark = await featuresLib.addBookmark(user.id, messageId, folderId, note);
        setBookmarks((prev) => [bookmark, ...prev]);
        return bookmark;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add bookmark');
        throw err;
      }
    },
    [user]
  );

  const removeBookmark = useCallback(
    async (messageId: string) => {
      if (!user) return;
      try {
        await featuresLib.removeBookmark(messageId, user.id);
        setBookmarks((prev) => prev.filter((b) => b.message_id !== messageId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove bookmark');
        throw err;
      }
    },
    [user]
  );

  const isBookmarked = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!user) return false;
      try {
        return await featuresLib.isMessageBookmarked(messageId, user.id);
      } catch (err) {
        console.error('Failed to check bookmark:', err);
        return false;
      }
    },
    [user]
  );

  return {
    bookmarks,
    loading,
    error,
    loadBookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
  };
};

export const useCollections = (workspaceId?: string) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<ChatCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await featuresLib.getCollections(workspaceId);
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const createCollection = useCallback(
    async (name: string, color?: string, parentId?: string) => {
      if (!workspaceId || !user) return;
      try {
        const collection = await featuresLib.createCollection(
          workspaceId,
          user.id,
          name,
          color,
          parentId
        );
        setCollections((prev) => [collection, ...prev]);
        return collection;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create collection');
        throw err;
      }
    },
    [workspaceId, user]
  );

  const deleteCollection = useCallback(async (collectionId: string) => {
    try {
      await featuresLib.deleteCollection(collectionId);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
      throw err;
    }
  }, []);

  return {
    collections,
    loading,
    error,
    loadCollections,
    createCollection,
    deleteCollection,
  };
};

export const useAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await featuresLib.getAggregatedAnalytics(user.id);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordStats = useCallback(
    async (model: string, tokens: number, responseTime?: number) => {
      if (!user) return;
      try {
        await featuresLib.incrementDailyStats(user.id, model, tokens, responseTime);
      } catch (err) {
        console.error('Failed to record stats:', err);
      }
    },
    [user]
  );

  return {
    analytics,
    loading,
    error,
    loadAnalytics,
    recordStats,
  };
};

export const useWorkspaces = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await featuresLib.getWorkspaces(user.id);
      setWorkspaces(data);
      if (data.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspace]);

  const createWorkspace = useCallback(
    async (name: string, description?: string) => {
      if (!user) return;
      try {
        const ws = await featuresLib.createWorkspace(user.id, name, description);
        setWorkspaces((prev) => [ws, ...prev]);
        return ws;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create workspace');
        throw err;
      }
    },
    [user]
  );

  return {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    loading,
    error,
    loadWorkspaces,
    createWorkspace,
  };
};
