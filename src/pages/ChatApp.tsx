import { useState, useEffect, lazy, Suspense } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatArea from '@/components/ChatArea';
import { Chat, Message, ImageGeneration, AppSettings } from '@/types/chat';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Menu, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import MotionBackground from '@/components/MotionBackground';

// Lazy load heavy components
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));
const ImagesGallery = lazy(() => import('@/components/ImagesGallery'));
const MemoryEditor = lazy(() => import('@/components/MemoryEditor'));
const SearchPanel = lazy(() => import('@/components/SearchPanel'));

const ChatApp = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'images' | 'memory' | 'search' | 'settings'>('chat');
  const [webSearchEnabled, setWebSearchEnabled] = useState(settings.enableWebSearch);
  const [deepSearchEnabled, setDeepSearchEnabled] = useState(settings.enableDeepSearch);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Apply theme
  useTheme(settings);

  // Auto-persist chats to prevent data loss
  useChatPersistence(chats, currentChatId);

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

  const handleSendMessage = async (content: string, attachments?: string[]) => {
    if (!currentChatId) return;

    const isImageCommand = content.trim().startsWith('/img');
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments,
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
        await handleTextChat(updatedChat.messages, currentChatId, attachments);
      }
    } catch (error: any) {
      if (settings.enableDebugLogs) {
        console.error('[DEBUG] Full AI Error:', JSON.stringify(error, null, 2));
      }
      console.error('AI Error:', error);
      
      let errorMessage = 'Failed to get response from AI';
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        errorMessage = 'Rate limit exceeded. You have used your 400M token quota. Please sign in with a new Puter account or wait for the limit to reset.';
      } else if (error.error?.message) {
        errorMessage = `API Error: ${error.error.message}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
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

  const handleTextChat = async (messages: Message[], chatId: string, attachments?: string[]) => {
    // @ts-ignore - Puter is loaded via script tag
    const puter = window.puter;

    // Build messages, optionally attaching files to the last user message
    const baseMessages = messages.map((m) => ({ role: m.role, content: m.content }));
    let formattedMessages: any[] = baseMessages;

    if (attachments && attachments.length > 0) {
      const lastIdx = baseMessages.length - 1;
      if (lastIdx >= 0 && baseMessages[lastIdx].role === 'user') {
        const last = baseMessages[lastIdx] as { role: string; content: string };
        const contentArray = [
          ...attachments.map((p) => ({ type: 'file', puter_path: p })),
          { type: 'text', text: last.content },
        ];
        formattedMessages = [
          ...baseMessages.slice(0, lastIdx),
          { role: 'user', content: contentArray },
        ];
      }
    }

    const systemPrompt = `You are a helpful AI assistant. ${webSearchEnabled ? 'You may use web knowledge if your model supports it.' : ''} ${deepSearchEnabled ? 'Prefer deeper step-by-step reasoning when needed.' : ''}`.trim();
    formattedMessages = [{ role: 'system', content: systemPrompt }, ...formattedMessages];

    // Use the full model ID including 'openrouter:' prefix for custom models
    const modelId = settings.textModel;

    if (settings.enableDebugLogs) {
      console.log('[DEBUG] Using model:', modelId);
      console.log('[DEBUG] webSearch:', webSearchEnabled, '| deepSearch:', deepSearchEnabled);
      console.log('[DEBUG] Messages:', JSON.stringify(formattedMessages, null, 2));
      console.log('[DEBUG] API Call params:', {
        model: modelId,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens
      });
    }

    const controller = new AbortController();
    setAbortController(controller);

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
        assistantMessage.content = fullResponse;
        const updatedMessages = [...messages, assistantMessage];
        storage.updateChat(chatId, { messages: updatedMessages });
        setChats(prevChats => prevChats.map(c => c.id === chatId ? { ...c, messages: updatedMessages } : c));
      }
    } finally {
      setAbortController(null);
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

  const handleNavigate = (section: 'images' | 'memory' | 'search' | 'settings') => {
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
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <MotionBackground />
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="glow-blue"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

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
      <div className="flex-1 overflow-hidden">
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
        </Suspense>
      </div>
    </div>
  );
};

export default ChatApp;
