import { Trigger } from './triggers';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string | string[];
  imagePrompt?: string;
  attachments?: string[];
  triggers?: Trigger[];
  metadata?: any; // Add this to store trigger metadata
  rawContent?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
  isIncognito?: boolean;
}

export interface ImageGeneration {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  model: string;
  chatId?: string;
}

export interface Memory {
  id: string;
  key: string;
  value: string;
  timestamp: number;
  category?: string;
  expiresAt?: number;
  importance?: 'low' | 'medium' | 'high';
  tags?: string[];
  autoExtracted?: boolean;
}

export interface AppSettings {
  textModel: string;
  imageModel: string;
  temperature: number;
  maxTokens: number;
  enableWebSearch: boolean;
  enableDeepSearch: boolean;
  enableDebugLogs?: boolean;
  themeColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  sidebarColor?: string;
  enableStreaming?: boolean;
  taskMode?: 'standard' | 'reasoning' | 'research' | 'creative';
  provider?: 'puter' | 'openrouter';
  customOpenRouterKey?: string;
}
