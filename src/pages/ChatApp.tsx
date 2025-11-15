import { useState, useEffect, lazy, Suspense } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatArea from '@/components/ChatArea';
import Header from '@/components/Header';
import { Chat, Message, ImageGeneration, AppSettings } from '@/types/chat';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Menu, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useAuth } from '@/hooks/useAuth';
import { useChatSync } from '@/hooks/useChatSync';
import MotionBackground from '@/components/MotionBackground';
import { createPuterAPILogger, createOpenRouterAPILogger } from '@/lib/api-logger';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { detectTriggersAndBuildPrompt, parseTriggeredResponse, getAllTriggers } from '@/lib/triggers';
import { chatMessageSchema } from '@/lib/validation';

// Lazy load heavy components
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));
const ImagesGallery = lazy(() => import('@/components/ImagesGallery'));
const MemoryEditor = lazy(() => import('@/components/MemoryEditor'));
const SearchPanel = lazy(() => import('@/components/SearchPanel'));
const LogCenter = lazy(() => import('@/components/LogCenter'));
const TriggerGallery = lazy(() => import('@/components/TriggerGallery'));
const CustomBotsManager = lazy(() => import('@/components/CustomBotsManager'));

const ChatApp = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'images' | 'memory' | 'search' | 'settings' | 'logs' | 'triggers' | 'bots'>('chat');
  const [webSearchEnabled, setWebSearchEnabled] = useState(settings.enableWebSearch);
  const [deepSearchEnabled, setDeepSearchEnabled] = useState(settings.enableDeepSearch);
  const [taskMode, setTaskMode] = useState<'standard' | 'reasoning' | 'research' | 'creative'>(settings.taskMode || 'standard');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const { user, signOut, loading: authLoading } = useAuth();
  const { playMessageComplete, playError } = useSoundEffects();

  // Apply theme
  useTheme(settings);

  // Auto-persist chats locally
  useChatPersistence(chats, currentChatId);
  
  // Sync chats to cloud if user is signed in
  useChatSync(chats, user?.id, setChats);

  useEffect(() => {
    try {
      const loadedChats = storage.getChats();
      setChats(loadedChats);
      const savedChatId = storage.getCurrentChatId();
      if (savedChatId && loadedChats.find(c => c.id === savedChatId)) {
        setCurrentChatId(savedChatId);
      } else if (loadedChats.length > 0) {
        // Auto-select first chat if saved chat doesn't exist
        setCurrentChatId(loadedChats[0].id);
        storage.setCurrentChatId(loadedChats[0].id);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  }, []);

  const currentChat = chats.find(c => c.id === currentChatId) || null;

  const createNewChat = () => {
      const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `# 👋 Welcome to OnyxGPT!

I'm your intelligent companion powered by cutting-edge AI models. Here's what I can do for you:

## 💬 **Chat & Conversations**
- Answer questions and have natural conversations
- Help with coding, writing, research, and problem-solving
- Multiple AI models: GPT-5, Claude Sonnet 4.5, Gemini 2.5 Pro, DeepSeek R1, Grok 3, and more!

## 🎨 **Image Generation**
- Create stunning images from text descriptions
- Just type your prompt and I'll generate images for you
- Powered by advanced image generation models

## 🔍 **Image Analysis**
- Upload any image and I'll analyze it
- Get detailed descriptions, identify objects, read text
- Ask questions about your uploaded images
- Supports vision-capable models (GPT-5, Gemini, Claude)

## 🌐 **Web & Deep Search**
- Enable web search to get real-time information
- Deep search for comprehensive research
- Toggle these features using the buttons below

## ⚙️ **Customize Your Experience**
- Access Settings to choose your preferred AI model
- Adjust temperature and creativity settings
- Switch between reasoning modes (Standard, Reasoning, Research, Creative)

**Ready to start?** Just type your message or upload an image below! 🚀`,
      timestamp: Date.now(),
    };

    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [welcomeMessage],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: settings.textModel,
    };
    storage.addChat(newChat);
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    storage.setCurrentChatId(newChat.id);
    setMobileMenuOpen(false);
  };

  const handleSendMessage = async (content: string, imageData?: { imageUrl: string; prompt: string }) => {
    if (!currentChatId) return;

    const isImageCommand = content.trim().startsWith('/img');
    const isVisionRequest = !!imageData;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: isVisionRequest ? content : content,
      timestamp: Date.now(),
      imageUrl: isVisionRequest ? imageData.imageUrl : undefined,
    };

    const updatedChat = { ...currentChat! };
    updatedChat.messages = [...updatedChat.messages, userMessage];
    storage.updateChat(currentChatId, { messages: updatedChat.messages });
    setChats(chats.map(c => c.id === currentChatId ? updatedChat : c));

    setIsLoading(true);

    try {
      if (isImageCommand) {
        await handleImageGeneration(content.replace('/img', '').trim(), currentChatId);
      } else if (isVisionRequest) {
        await handleVisionChat(imageData.imageUrl, imageData.prompt, updatedChat.messages, currentChatId);
      } else {
        await handleTextChat(updatedChat.messages, currentChatId);
      }
    } catch (error: any) {
      // Only log detailed errors in development
      if (import.meta.env.DEV) {
        console.error('[DEBUG] Full AI Error:', JSON.stringify(error, null, 2));
        console.error('AI Error:', error);
      }
      
      let errorMessage = 'An error occurred. Please try again.';
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message?.includes('OpenRouter')) {
        errorMessage = 'OpenRouter API error. Check your settings or try a different model.';
      } else if (error.message?.includes('not available')) {
        errorMessage = 'AI service not available. Please sign in to Puter in Settings.';
      }
      
      playError();
      toast.error(errorMessage);
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: Date.now(),
      };
      const messages = [...updatedChat.messages, errorMsg];
      storage.updateChat(currentChatId, { messages });
      setChats(chats.map(c => c.id === currentChatId ? { ...c, messages } : c));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChat = async (messages: Message[], chatId: string, selectedTriggers?: string[]) => {
     // Validate input - extract user message first
     const lastUser = [...messages].reverse().find((m) => m.role === 'user');
     const userText = lastUser?.content ?? '';
     
     if (!userText.trim()) return;
     
     // Validate message using Zod schema
     const validationResult = chatMessageSchema.safeParse({
       content: userText,
       role: 'user',
     });
     
     if (!validationResult.success) {
       const error = validationResult.error.errors[0];
       toast.error(error.message || 'Invalid message');
       setIsLoading(false);
       return;
     }

     // Use selected model
     const modelId = settings.textModel;
     
     // Venice uncensored model uses OpenRouter endpoint only
     const isVeniceModel = modelId.includes('dolphin-mistral-24b-venice');
     
     if (isVeniceModel) {
       await handleOpenRouterChat(messages, chatId, selectedTriggers);
       return;
     }

    // @ts-ignore - Puter is loaded via script tag (HTML style)
    const puter = (window as any)?.puter;
    if (!puter?.ai?.chat) {
      toast.error('AI service not available');
      setIsLoading(false);
      return;
    }

    // Detect triggers and build system prompt
    let { systemPrompt: triggerPrompt, detectedTriggers } = detectTriggersAndBuildPrompt(userText);
    
    // Merge default triggers (from settings) + selected triggers
    let extraInstructions: string[] = [];
    if (settings.defaultTriggers && settings.defaultTriggers.length > 0) {
      const allTriggersData = getAllTriggers();
      settings.defaultTriggers.forEach((trigName) => {
        const found = allTriggersData.find(a => a.trigger.toLowerCase() === trigName.toLowerCase());
        if (found) {
          extraInstructions.push(found.system_instruction);
        }
      });
    }

    if (selectedTriggers && selectedTriggers.length > 0) {
      const allTriggersData = getAllTriggers();
      selectedTriggers.forEach((trigName) => {
        const found = allTriggersData.find(a => a.trigger.toLowerCase() === trigName.toLowerCase());
        if (found && !extraInstructions.includes(found.system_instruction)) {
          extraInstructions.push(found.system_instruction);
        }
      });
    }

    if (extraInstructions.length > 0) {
      triggerPrompt += '\n\n' + extraInstructions.join('\n\n');
    }
    
    // Build final system prompt with triggers (backend only - not visible to user)
    let finalSystemPrompt = triggerPrompt;
    if (webSearchEnabled) {
      finalSystemPrompt += '\n\nNote: You may use web knowledge if your model supports it.';
    }
    if (deepSearchEnabled) {
      finalSystemPrompt += '\n\nNote: Prefer deeper step-by-step reasoning when needed.';
    }
    
    // Log detected triggers in dev mode
    if (import.meta.env.DEV && settings.enableDebugLogs && detectedTriggers.length > 0) {
      console.log('[DEBUG] Detected triggers:', detectedTriggers);
      console.log('[DEBUG] System prompt:', finalSystemPrompt);
    }
    
    // Store triggers in user message for later reference
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      lastUserMessage.triggers = detectedTriggers;
    }
    
    const baseMessages = messages
      .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));
    let formattedMessages: any[] = [{ role: 'system', content: finalSystemPrompt }, ...baseMessages];

    // Only log in development
    if (import.meta.env.DEV && settings.enableDebugLogs) {
      console.log('[DEBUG] Using model:', modelId);
      console.log('[DEBUG] webSearch:', webSearchEnabled, '| deepSearch:', deepSearchEnabled);
      console.log('[DEBUG] Messages:', JSON.stringify(formattedMessages, null, 2));
      console.log('[DEBUG] API Call params:', {
        model: modelId,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      });
    }

    const controller = new AbortController();
    setAbortController(controller);

    const logger = createPuterAPILogger();
    const chatParams = {
      messages: formattedMessages,
      options: {
        model: modelId,
        stream: true,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      }
    };

    try {
      const response = await puter.ai.chat(formattedMessages, {
        model: modelId,
        stream: true,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      });

      let fullResponse = '';
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        triggers: detectedTriggers.length > 0 ? detectedTriggers : undefined,
      };

      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      try {
        for await (const part of response) {
          if (controller.signal.aborted) {
            break;
          }
          
          fullResponse += part?.text || '';
          
          // Parse trigger tags and extract clean content
          const { cleanContent, taggedSegments } = parseTriggeredResponse(fullResponse);
          
          // Always update with the same assistant message, just changing content
          const currentMessages = [...messages, { 
            ...assistantMessage, 
            content: cleanContent,
            rawContent: fullResponse,
            taggedSegments: taggedSegments.length > 0 ? taggedSegments : undefined,
          }];
          
          if (!settings.incognitoMode) {
            storage.updateChat(chatId, { messages: currentMessages });
          }
          setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, messages: currentMessages } : c));
        }
      } finally {
        setAbortController(null);
      }

      playMessageComplete();
      logger.logSuccess('puter.ai.chat (streaming)', chatParams, fullResponse);
    } catch (streamError: any) {
      logger.logError('puter.ai.chat (streaming)', chatParams, streamError);
      
      // Check for rate limit errors
      const errorMsg = streamError?.message || String(streamError);
      if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('429')) {
        toast.error('⚠️ Puter Rate Limit Reached', {
          description: 'Please wait a moment before trying again. Too many requests.',
          duration: 5000,
        });
      } else if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('credit')) {
        toast.error('💳 Puter Credit Limit', {
          description: 'Your Puter credits may be exhausted. Please check your account.',
          duration: 5000,
        });
      }
      
      throw streamError;
    }

    // Auto-generate title for first message using Puter JS with gpt-5-nano
    if (messages.length === 1) {
      try {
        // @ts-ignore
        const puter = (window as any)?.puter;
        if (puter?.ai?.chat) {
          const systemPrompt = 'You generate concise, human-friendly chat titles (max 6 words). No punctuation like quotes. No emojis.';
          const userPrompt = `Create a short title for this chat based on the user's first message: \n\n${messages[0].content}`;
          const titleResponse = await puter.ai.chat(`${systemPrompt}\n\n${userPrompt}`, { model: 'gpt-5-nano' });
          const title = (typeof titleResponse === 'string' ? titleResponse : String(titleResponse)).trim().slice(0, 60) || messages[0].content.slice(0, 50);
          storage.updateChat(chatId, { title });
          setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title } : c));
        } else {
          const fallback = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
          storage.updateChat(chatId, { title: fallback });
          setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title: fallback } : c));
        }
      } catch (e) {
        const fallback = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
        storage.updateChat(chatId, { title: fallback });
        setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title: fallback } : c));
      }
    }
  };

  const handleOpenRouterChat = async (messages: Message[], chatId: string, selectedTriggers?: string[]) => {
     // Get user message for trigger detection
     const lastUser = [...messages].reverse().find((m) => m.role === 'user');
     const userText = lastUser?.content ?? '';
     
     // Validate message using Zod schema
     const validationResult = chatMessageSchema.safeParse({
       content: userText,
       role: 'user',
     });
     
     if (!validationResult.success) {
       const error = validationResult.error.errors[0];
       toast.error(error.message || 'Invalid message');
       setIsLoading(false);
       return;
     }
     
     // Detect triggers and build system prompt
     let { systemPrompt: triggerPrompt, detectedTriggers } = detectTriggersAndBuildPrompt(userText);

    // Merge default triggers (from settings) + selected triggers
    let extraInstructions: string[] = [];
    if (settings.defaultTriggers && settings.defaultTriggers.length > 0) {
      const allTriggersData = getAllTriggers();
      settings.defaultTriggers.forEach((trigName) => {
        const found = allTriggersData.find(a => a.trigger.toLowerCase() === trigName.toLowerCase());
        if (found) {
          extraInstructions.push(found.system_instruction);
        }
      });
    }

    if (selectedTriggers && selectedTriggers.length > 0) {
      const allTriggersData = getAllTriggers();
      selectedTriggers.forEach((trigName) => {
        const found = allTriggersData.find(a => a.trigger.toLowerCase() === trigName.toLowerCase());
        if (found && !extraInstructions.includes(found.system_instruction)) {
          extraInstructions.push(found.system_instruction);
        }
      });
    }

    if (extraInstructions.length > 0) {
      triggerPrompt += '\n\n' + extraInstructions.join('\n\n');
    }
     
     // Build final system prompt with triggers
     let finalSystemPrompt = triggerPrompt + ' ' + userText;
    if (webSearchEnabled) {
      finalSystemPrompt += '\n\nNote: You may use web knowledge if your model supports it.';
    }
    if (deepSearchEnabled) {
      finalSystemPrompt += '\n\nNote: Prefer deeper step-by-step reasoning when needed.';
    }
    
    // Log detected triggers in dev mode
    if (import.meta.env.DEV && settings.enableDebugLogs && detectedTriggers.length > 0) {
      console.log('[DEBUG] Detected triggers:', detectedTriggers);
    }
    
    const baseMessages = messages
      .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));
    const formattedMessages = [{ role: 'system', content: finalSystemPrompt }, ...baseMessages];

    // Remove 'openrouter:' prefix for the actual API call
    const modelId = settings.textModel.replace('openrouter:', '');

    if (settings.enableDebugLogs) {
      console.log('[DEBUG] OpenRouter model:', modelId);
    }

    const controller = new AbortController();
    setAbortController(controller);

    const logger = createOpenRouterAPILogger();
    const apiParams = {
      messages: formattedMessages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    };

    try {
      // Get JWT token from Supabase for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: formattedMessages,
          model: modelId,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          // SECURITY: Custom API keys should be stored server-side in Supabase secrets
          // For now, removed to prevent client-side exposure
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenRouter');
      }

      let fullResponse = '';
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                const currentMessages = [...messages, { ...assistantMessage, content: fullResponse }];
                storage.updateChat(chatId, { messages: currentMessages });
                setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, messages: currentMessages } : c));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      playMessageComplete();
      logger.logSuccess(modelId, apiParams, fullResponse);
      
      // Log OpenRouter API call success
      if (settings.enableDebugLogs) {
        console.log('[DEBUG] OpenRouter call successful:', {
          model: modelId,
          messageLength: fullResponse.length,
          tokensEstimate: Math.ceil(fullResponse.length / 4),
        });
      }
      setAbortController(null);
    } catch (error: any) {
      console.error('OpenRouter streaming error:', error);
      logger.logError(modelId, apiParams, error);
      playError();
      
      // Check for rate limit errors
      const errorMsg = error?.message || String(error);
      if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('429')) {
        toast.error('⚠️ OpenRouter Rate Limit Reached', {
          description: 'Please wait before trying again. Too many requests to OpenRouter API.',
          duration: 5000,
        });
      } else if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('credit') || errorMsg.toLowerCase().includes('402')) {
        toast.error('💳 OpenRouter Credit Limit', {
          description: 'OpenRouter credits exhausted. Please add credits to your OpenRouter account.',
          duration: 5000,
        });
      } else {
        toast.error('❌ OpenRouter Error', {
          description: errorMsg.slice(0, 100),
          duration: 5000,
        });
      }
      
      setIsLoading(false);
      setAbortController(null);
      throw error;
    }

    // Auto-generate title for first message using Puter JS with gpt-5-nano
    if (messages.length === 1) {
      try {
        // @ts-ignore
        const puter = (window as any)?.puter;
        if (puter?.ai?.chat) {
          const systemPrompt = 'You generate concise, human-friendly chat titles (max 6 words). No punctuation like quotes. No emojis.';
          const userPrompt = `Create a short title for this chat based on the user's first message: \n\n${messages[0].content}`;
          const titleResponse = await puter.ai.chat(`${systemPrompt}\n\n${userPrompt}`, { model: 'gpt-5-nano' });
          const title = (typeof titleResponse === 'string' ? titleResponse : String(titleResponse)).trim().slice(0, 60) || messages[0].content.slice(0, 50);
          storage.updateChat(chatId, { title });
          setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title } : c));
        } else {
          const fallback = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
          storage.updateChat(chatId, { title: fallback });
          setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title: fallback } : c));
        }
      } catch (e) {
        const fallback = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
        storage.updateChat(chatId, { title: fallback });
        setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title: fallback } : c));
      }
    }
  };

  const handleVisionChat = async (imageUrl: string | string[], prompt: string, messages: Message[], chatId: string) => {
    // @ts-ignore - Puter is loaded via script tag
    const puter = (window as any)?.puter;
    if (!puter?.ai?.chat) {
      toast.error('Puter AI service not available. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    const logger = createPuterAPILogger();

    try {
      console.log('[Vision] Analyzing image(s):', imageUrl);
      console.log('[Vision] Prompt:', prompt);
      console.log('[Vision] Using model:', settings.textModel);
      
      // Use streaming for real-time response
      const response = await puter.ai.chat(prompt, imageUrl, {
        model: settings.textModel,
        stream: true,
      });

      let fullResponse = '';
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      try {
        for await (const part of response) {
          if (controller.signal.aborted) {
            break;
          }
          
          fullResponse += part?.text || '';
          const currentMessages = [...messages, { ...assistantMessage, content: fullResponse }];
          storage.updateChat(chatId, { messages: currentMessages });
          setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, messages: currentMessages } : c));
        }
        
        playMessageComplete();
        logger.logSuccess('puter.ai.chat (vision)', { prompt, imageUrl, model: settings.textModel }, fullResponse);
        console.log('[Vision] Analysis complete');
      } finally {
        setAbortController(null);
      }
    } catch (error: any) {
      logger.logError('puter.ai.chat (vision)', { prompt, imageUrl }, error);
      console.error('[Vision] Error:', error);
      playError();
      toast.error(error?.message || 'Failed to analyze image');
      throw error;
    }

    // Auto-generate title for first message
    if (messages.length === 1) {
      try {
        // @ts-ignore
        const puter = (window as any)?.puter;
        if (puter?.ai?.chat) {
          const systemPrompt = 'You generate concise, human-friendly chat titles (max 6 words). No punctuation like quotes. No emojis.';
          const userPrompt = `Create a short title for this chat based on the user's first message: \n\n${messages[0].content}`;
          const titleResponse = await puter.ai.chat(`${systemPrompt}\n\n${userPrompt}`, { model: 'gpt-5-nano' });
          const title = (typeof titleResponse === 'string' ? titleResponse : String(titleResponse)).trim().slice(0, 60) || messages[0].content.slice(0, 50);
          storage.updateChat(chatId, { title });
          setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title } : c));
        } else {
          const fallback = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
          storage.updateChat(chatId, { title: fallback });
          setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title: fallback } : c));
        }
      } catch (e) {
        const fallback = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
        storage.updateChat(chatId, { title: fallback });
        setChats((prev) => prev.map(c => c.id === chatId ? { ...c, title: fallback } : c));
      }
    }
  };

  const handleImageGeneration = async (prompt: string, chatId: string) => {
    console.log('Generating image with model:', settings.imageModel);
    
    // Random seed for variety
    const seed = Math.floor(Math.random() * 1000000);

    // @ts-ignore
    const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${settings.imageModel}&seed=${seed}&width=1024&height=1024&nologo=true`);
    
    const imageUrl = response.url;

    const imageMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Generated image with ${settings.imageModel}`,
      timestamp: Date.now(),
      imageUrl,
      imagePrompt: prompt,
    };

    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const updatedMessages = [...chat.messages, imageMessage];
    storage.updateChat(chatId, { messages: updatedMessages });
    setChats(chats.map(c => c.id === chatId ? { ...c, messages: updatedMessages } : c));

    // Save to images gallery
    const imageGen: ImageGeneration = {
      id: Date.now().toString(),
      prompt,
      imageUrl,
      timestamp: Date.now(),
      model: settings.imageModel,
      chatId,
    };
    storage.addImage(imageGen);

    playMessageComplete();
    toast.success(`Image generated with ${settings.imageModel}`);
  };

  const handleNavigate = (section: 'images' | 'memory' | 'search' | 'settings' | 'logs') => {
    setCurrentView(section);
    setMobileMenuOpen(false);
  };

  const handleUpdateTitle = (chatId: string, title: string) => {
    storage.updateChat(chatId, { title });
    setChats(chats.map(c => c.id === chatId ? { ...c, title } : c));
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      // Update local immediately for snappy UI
      setChats((prev) => {
        const next = prev.filter((c) => c.id !== chatId);
        storage.saveChats(next);
        return next;
      });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        storage.setCurrentChatId(null);
      }

      // Let the useChatSync hook detect and propagate deletions to the cloud.
      // This avoids race conditions where an immediate upsert could recreate the chat.
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    if (!currentChat) return;
    const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const previousMessages = currentChat.messages.slice(0, messageIndex);
    const updatedChat = { ...currentChat, messages: previousMessages };
    storage.updateChat(currentChatId!, { messages: previousMessages });
    setChats(chats.map(c => c.id === currentChatId ? updatedChat : c));

    setIsLoading(true);
    try {
      await handleTextChat(previousMessages, currentChatId!);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentChat) return;
    const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Update the message content and delete all messages after it
    const updatedMessages = currentChat.messages.slice(0, messageIndex);
    const editedMessage = { ...currentChat.messages[messageIndex], content: newContent };
    updatedMessages.push(editedMessage);

    storage.updateChat(currentChatId!, { messages: updatedMessages });
    setChats(chats.map(c => c.id === currentChatId ? { ...c, messages: updatedMessages } : c));

    // Regenerate AI response
    setIsLoading(true);
    try {
      await handleTextChat(updatedMessages, currentChatId!);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    setWebSearchEnabled(newSettings.enableWebSearch);
    setDeepSearchEnabled(newSettings.enableDeepSearch);
    setTaskMode(newSettings.taskMode || 'standard');
  };

  const handleExportChats = () => {
    storage.exportChats();
    toast.success('Chats exported');
  };

  const handleImportChats = async (file: File) => {
    try {
      await storage.importChats(file);
      const loadedChats = storage.getChats();
      setChats(loadedChats);
      toast.success('Chats imported successfully');
    } catch (error) {
      toast.error('Failed to import chats');
    }
  };

  const handleClearAllData = () => {
    localStorage.clear();
    setChats([]);
    setCurrentChatId(null);
    toast.success('All data cleared');
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      toast.info('Generation stopped');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      <MotionBackground />
      <Header 
        showMenuButton={true}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        user={user}
        onSignOut={signOut}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            'md:static md:translate-x-0',
            'fixed inset-y-0 left-0 z-40 w-72 md:w-auto',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
        <ChatSidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={createNewChat}
          onSelectChat={(id) => {
            setCurrentChatId(id);
            storage.setCurrentChatId(id);
            setCurrentView('chat');
            setMobileMenuOpen(false);
          }}
          onDeleteChat={handleDeleteChat}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {currentView === 'chat' && (
          <ChatArea
            chat={currentChat}
            onSendMessage={handleSendMessage}
            onUpdateTitle={handleUpdateTitle}
            onDeleteChat={handleDeleteChat}
            onRegenerateMessage={handleRegenerateMessage}
            onEditMessage={handleEditMessage}
            isLoading={isLoading}
            onStopGeneration={handleStopGeneration}
            webSearchEnabled={webSearchEnabled}
            deepSearchEnabled={deepSearchEnabled}
            onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
            onToggleDeepSearch={() => setDeepSearchEnabled(!deepSearchEnabled)}
            currentModel={settings.textModel}
            taskMode={taskMode}
            onTaskModeChange={setTaskMode}
          />
        )}
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          {currentView === 'settings' && (
            <SettingsPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExportChats={handleExportChats}
              onImportChats={handleImportChats}
              onClearAllData={handleClearAllData}
            />
          )}
          {currentView === 'images' && <ImagesGallery />}
          {currentView === 'memory' && <MemoryEditor />}
          {currentView === 'search' && (
            <SearchPanel onSelectChat={(id) => {
              setCurrentChatId(id);
              storage.setCurrentChatId(id);
              setCurrentView('chat');
            }} />
          )}
          {currentView === 'logs' && <LogCenter />}
          {currentView === 'triggers' && <TriggerGallery />}
          {currentView === 'bots' && (
            <CustomBotsManager 
              onSelectBot={(bot) => {
                toast.success(`Selected bot: ${bot.name}`, {
                  description: 'Bot will be applied to new chats',
                });
                setCurrentView('chat');
              }}
            />
          )}
        </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
