import { DetectedTrigger } from '@/lib/triggers';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string;
  imagePrompt?: string;
  attachments?: string[];
  triggers?: DetectedTrigger[]; // Triggers detected in user message
  rawContent?: string; // Original content with tags (for assistant messages)
  taggedSegments?: Array<{ tag: string; content: string; startIndex: number; endIndex: number }>;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
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
  sidebarColor?: string; // New: sidebar color customization
  taskMode?: 'standard' | 'reasoning' | 'research' | 'creative';
  provider?: 'puter' | 'openrouter';
  customOpenRouterKey?: string;
  streamingEnabled?: boolean; // New: toggle streaming
  incognitoMode?: boolean; // New: private chat mode
  defaultTriggers?: string[]; // Default triggers to apply to all messages
}

export interface CustomBot {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  logo?: string;
  category?: string;
  isPublic: boolean;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
  usageCount?: number;
}
