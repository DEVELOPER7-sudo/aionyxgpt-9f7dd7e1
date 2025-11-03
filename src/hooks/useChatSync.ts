import { useEffect, useRef } from 'react';
import { Chat } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useChatSync = (
  chats: Chat[],
  userId: string | undefined,
  setChats: (chats: Chat[]) => void
) => {
  const lastSyncRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const prevChatsRef = useRef<Chat[]>([]);

  // Load chats from cloud when user logs in
  useEffect(() => {
    if (!userId) return;

    const loadCloudChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const cloudChats: Chat[] = data.map(row => ({
            id: row.id,
            title: row.title,
            messages: row.messages as any[],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            model: row.model || 'gpt-5-nano'
          }));

          // Merge with local chats (cloud takes priority)
          const localChats = chats.filter(
            chat => !cloudChats.find(c => c.id === chat.id)
          );
          setChats([...cloudChats, ...localChats]);
        }
      } catch (error) {
        // Only log in development
        if (import.meta.env.DEV) {
          console.error('Error loading cloud chats:', error);
        }
        toast.error('Failed to load chats from cloud');
      }
    };

    loadCloudChats();
  }, [userId]);

  // Detect deletions and propagate to cloud immediately
  useEffect(() => {
    if (!userId) {
      prevChatsRef.current = chats;
      return;
    }

    const prevIds = new Set(prevChatsRef.current.map((c) => c.id));
    const currIds = new Set(chats.map((c) => c.id));
    const removedIds = Array.from(prevIds).filter((id) => !currIds.has(id));

    if (removedIds.length > 0) {
      (async () => {
        try {
          for (const id of removedIds) {
            const { error } = await supabase
              .from('chats')
              .delete()
              .eq('user_id', userId)
              .eq('id', id);
            if (error) throw error;
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('Error propagating deletions:', err);
          // Soft notify, don't block UI
          toast.error('Failed to delete chat from cloud');
        }
      })();
    }

    prevChatsRef.current = chats;
  }, [chats, userId]);

  // Sync chats to cloud with debouncing
  useEffect(() => {
    if (!userId || chats.length === 0) return;

    const now = Date.now();
    if (now - lastSyncRef.current < 1000) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        // Upsert each chat to cloud
        for (const chat of chats) {
          const { error } = await supabase
            .from('chats')
            .upsert([{
              user_id: userId,
              id: chat.id,
              title: chat.title,
              messages: chat.messages as any,
              model: chat.model || 'gpt-5-nano',
              created_at: chat.createdAt,
              updated_at: chat.updatedAt
            }]);

          if (error) throw error;
        }

        lastSyncRef.current = Date.now();
      } catch (error) {
        // Only log in development
        if (import.meta.env.DEV) {
          console.error('Error syncing chats:', error);
        }
        // Silent fail for sync - don't interrupt user experience
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [chats, userId]);
};