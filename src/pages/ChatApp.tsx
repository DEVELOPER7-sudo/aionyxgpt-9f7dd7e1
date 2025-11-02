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
import { createPuterAPILogger } from '@/lib/api-logger';
import { supabase } from '@/integrations/supabase/client';

// Lazy load heavy components
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));
const ImagesGallery = lazy(() => import('@/components/ImagesGallery'));
const MemoryEditor = lazy(() => import('@/components/MemoryEditor'));
const SearchPanel = lazy(() => import('@/components/SearchPanel'));
const LogCenter = lazy(() => import('@/components/LogCenter'));

const ChatApp = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'images' | 'memory' | 'search' | 'settings' | 'logs'>('chat');
  const [webSearchEnabled, setWebSearchEnabled] = useState(settings.enableWebSearch);
  const [deepSearchEnabled, setDeepSearchEnabled] = useState(settings.enableDeepSearch);
  const [taskMode, setTaskMode] = useState<'standard' | 'reasoning' | 'research' | 'creative'>(settings.taskMode || 'standard');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const { user, signOut, loading: authLoading } = useAuth();

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
      content: `Hello! I'm your AI assistant. I can help you with:

• **Text Generation** - Write, edit, and brainstorm content
• **Code Assistance** - Debug, explain, and write code
• **Image Creation** - Use /img followed by your prompt to generate images
• **Research & Analysis** - Answer questions and analyze information
• **Problem Solving** - Step-by-step guidance for complex tasks

**Quick Tips:**
- Toggle Web Search for real-time information
- Enable Deep Search for detailed reasoning
- Use the settings panel to customize AI models
- Check Debug Logs in settings if you encounter issues

What would you like to work on today?`,
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

  const handleSendMessage = async (content: string) => {
    if (!currentChatId) return;

    const isImageCommand = content.trim().startsWith('/img');
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedChat = { ...currentChat! };
    updatedChat.messages = [...updatedChat.messages, userMessage];
    storage.updateChat(currentChatId, { messages: updatedChat.messages });
    setChats(chats.map(c => c.id === currentChatId ? updatedChat : c));

    setIsLoading(true);

    try {
      if (isImageCommand) {
        await handleImageGeneration(content.replace('/img', '').trim(), currentChatId);
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
      }
      
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

  const handleTextChat = async (messages: Message[], chatId: string) => {
    // @ts-ignore - Puter is loaded via script tag (HTML style)
    const puter = (window as any)?.puter;
    if (!puter?.ai?.chat) {
      toast.error('AI service not available');
      setIsLoading(false);
      return;
    }

    // Validate input - extract user message first
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const userText = lastUser?.content ?? '';
    
    if (!userText.trim()) return;
    
    // Validate message length
    if (userText.length > 10000) {
      toast.error('Message too long (max 10,000 characters)');
      setIsLoading(false);
      return;
    }

    // Use selected model
    const modelId = settings.textModel;

    // Regular text-only flow with system prompt
    const systemPrompt = `You are a helpful AI assistant. ${webSearchEnabled ? 'You may use web knowledge if your model supports it.' : ''} ${deepSearchEnabled ? 'Prefer deeper step-by-step reasoning when needed.' : ''}`.trim();
    const baseMessages = messages
      .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));
    let formattedMessages: any[] = [{ role: 'system', content: systemPrompt }, ...baseMessages];


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
      };

      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      try {
        for await (const part of response) {
          if (controller.signal.aborted) {
            break;
          }
          
          fullResponse += part?.text || '';
          // Always update with the same assistant message, just changing content
          const currentMessages = [...messages, { ...assistantMessage, content: fullResponse }];
          storage.updateChat(chatId, { messages: currentMessages });
          setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, messages: currentMessages } : c));
        }
      } finally {
        setAbortController(null);
      }

      logger.logSuccess('puter.ai.chat (streaming)', chatParams, fullResponse);
    } catch (streamError) {
      logger.logError('puter.ai.chat (streaming)', chatParams, streamError);
      throw streamError;
    }

    // Auto-generate title for first message
    if (messages.length === 1) {
      const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
      storage.updateChat(chatId, { title });
      setChats(chats.map(c => c.id === chatId ? { ...c, title } : c));
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

  const handleDeleteChat = (chatId: string) => {
    storage.deleteChat(chatId);
    setChats(chats.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      storage.setCurrentChatId(null);
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
        </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
