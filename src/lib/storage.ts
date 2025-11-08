import { Chat, ImageGeneration, Memory, AppSettings } from '@/types/chat';
import { Trigger } from '@/lib/triggers';
import { CustomBot } from '@/types/bots';

const STORAGE_KEYS = {
  CHATS: 'ai_studio_chats',
  IMAGES: 'ai_studio_images',
  MEMORY: 'ai_studio_memory',
  SETTINGS: 'ai_studio_settings',
  CURRENT_CHAT: 'ai_studio_current_chat',
  CUSTOM_TRIGGERS: 'ai_studio_custom_triggers',
  CUSTOM_BOTS: 'ai_studio_custom_bots',
};

export const storage = {
  // Triggers
  getCustomTriggers: (): Trigger[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TRIGGERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading custom triggers:', error);
      return [];
    }
  },

  setCustomTriggers: (triggers: Trigger[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TRIGGERS, JSON.stringify(triggers));
    } catch (error) {
      console.error('Error saving custom triggers:', error);
    }
  },

  addCustomTrigger: (trigger: Trigger) => {
    const triggers = storage.getCustomTriggers();
    triggers.push(trigger);
    storage.setCustomTriggers(triggers);
  },

  updateCustomTrigger: (triggerName: string, updates: Partial<Trigger>) => {
    const triggers = storage.getCustomTriggers();
    const index = triggers.findIndex(t => t.trigger === triggerName);
    if (index !== -1) {
      triggers[index] = { ...triggers[index], ...updates };
      storage.setCustomTriggers(triggers);
    }
  },

  deleteCustomTrigger: (triggerName: string) => {
    let triggers = storage.getCustomTriggers();
    triggers = triggers.filter(t => t.trigger !== triggerName);
    storage.setCustomTriggers(triggers);
  },
  
  // Bots
  getCustomBots: (): CustomBot[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_BOTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading custom bots:', error);
      return [];
    }
  },

  saveCustomBots: (bots: CustomBot[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BOTS, JSON.stringify(bots));
    } catch (error) {
      console.error('Error saving custom bots:', error);
    }
  },

  // Chats
  getChats: (): Chat[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHATS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    }
  },

  saveChats: (chats: Chat[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  },

  addChat: (chat: Chat) => {
    const chats = storage.getChats();
    chats.unshift(chat);
    storage.saveChats(chats);
  },

  updateChat: (chatId: string, updates: Partial<Chat>) => {
    const chats = storage.getChats();
    const index = chats.findIndex(c => c.id === chatId);
    if (index !== -1) {
      chats[index] = { ...chats[index], ...updates, updatedAt: Date.now() };
      storage.saveChats(chats);
    }
  },

  deleteChat: (chatId: string) => {
    const chats = storage.getChats().filter(c => c.id !== chatId);
    storage.saveChats(chats);
  },

  exportChats: () => {
    const chats = storage.getChats();
    const dataStr = JSON.stringify(chats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-studio-chats-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importChats: (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const chats = JSON.parse(e.target?.result as string);
          storage.saveChats(chats);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // Images
  getImages: (): ImageGeneration[] => {
    const data = localStorage.getItem(STORAGE_KEYS.IMAGES);
    return data ? JSON.parse(data) : [];
  },

  saveImages: (images: ImageGeneration[]) => {
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(images));
  },

  addImage: (image: ImageGeneration) => {
    const images = storage.getImages();
    images.unshift(image);
    storage.saveImages(images);
  },

  deleteImage: (imageId: string) => {
    const images = storage.getImages().filter(i => i.id !== imageId);
    storage.saveImages(images);
  },

  // Memory
  getMemories: (): Memory[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEMORY);
    return data ? JSON.parse(data) : [];
  },

  saveMemories: (memories: Memory[]) => {
    localStorage.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(memories));
  },

  addMemory: (memory: Memory) => {
    const memories = storage.getMemories();
    memories.unshift(memory);
    storage.saveMemories(memories);
  },

  updateMemory: (memoryId: string, updates: Partial<Memory>) => {
    const memories = storage.getMemories();
    const index = memories.findIndex(m => m.id === memoryId);
    if (index !== -1) {
      memories[index] = { ...memories[index], ...updates, timestamp: Date.now() };
      storage.saveMemories(memories);
    }
  },

  deleteMemory: (memoryId: string) => {
    const memories = storage.getMemories().filter(m => m.id !== memoryId);
    storage.saveMemories(memories);
  },

  searchMemories: (query: string): Memory[] => {
    const memories = storage.getMemories();
    const lowerQuery = query.toLowerCase();
    return memories.filter(m => 
      m.key.toLowerCase().includes(lowerQuery) || 
      m.value.toLowerCase().includes(lowerQuery) ||
      m.category?.toLowerCase().includes(lowerQuery) ||
      m.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  getMemoriesByCategory: (category: string): Memory[] => {
    return storage.getMemories().filter(m => m.category === category);
  },

  getActiveMemories: (): Memory[] => {
    const now = Date.now();
    return storage.getMemories().filter(m => !m.expiresAt || m.expiresAt > now);
  },

  cleanExpiredMemories: () => {
    const now = Date.now();
    const memories = storage.getMemories().filter(m => !m.expiresAt || m.expiresAt > now);
    storage.saveMemories(memories);
  },

  getMemoryCategories: (): string[] => {
    const memories = storage.getMemories();
    const categories = new Set<string>();
    memories.forEach(m => {
      if (m.category) categories.add(m.category);
    });
    return Array.from(categories).sort();
  },

  // Settings
  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {
        textModel: 'gpt-5-nano',
        imageModel: 'flux',
        temperature: 0.7,
        maxTokens: 2000,
        enableWebSearch: false,
        enableDeepSearch: false,
        enableDebugLogs: false,
        themeColor: '217 91% 60%',
        accentColor: '217 91% 60%',
        backgroundColor: '0 0% 0%',
        provider: 'puter',
        customOpenRouterKey: undefined,
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        textModel: 'gpt-5-nano',
        imageModel: 'flux',
        temperature: 0.7,
        maxTokens: 2000,
        enableWebSearch: false,
        enableDeepSearch: false,
        themeColor: '217 91% 60%',
        accentColor: '217 91% 60%',
        backgroundColor: '0 0% 0%',
        provider: 'puter',
        customOpenRouterKey: undefined,
      };
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Current chat
  getCurrentChatId: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT);
  },

  setCurrentChatId: (chatId: string | null) => {
    if (chatId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT, chatId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
    }
  },
};
