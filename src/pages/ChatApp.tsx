import { useState, useEffect, lazy, Suspense } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatArea from '@/components/ChatArea';
import Header from '@/components/Header';
import { Chat, Message, AppSettings } from '@/types/chat';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useAuth } from '@/hooks/useAuth';
import { useChatSync } from '@/hooks/useChatSync';
import MotionBackground from '@/components/MotionBackground';
import { detectTriggersAndBuildPrompt, Trigger } from '@/lib/triggers';
import TriggerBar from '@/components/TriggerBar';

const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));
const ImagesGallery = lazy(() => import('@/components/ImagesGallery'));
const LogCenter = lazy(() => import('@/components/LogCenter'));
const TriggerGallery = lazy(() => import('@/components/TriggerGallery'));
const CustomBotsPanel = lazy(() => import('@/components/CustomBotsPanel'));

const ChatApp = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'images' | 'settings' | 'logs' | 'triggers' | 'bots'>('chat');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const { user, signOut } = useAuth();

  useTheme(settings);
  useChatPersistence(chats, currentChatId);
  useChatSync(chats, user?.id, setChats);

  useEffect(() => {
    setChats(storage.getChats());
    setCurrentChatId(storage.getCurrentChatId());
  }, []);

  const currentChat = chats.find(c => c.id === currentChatId) || null;
  const lastMessage = currentChat?.messages[currentChat.messages.length - 1];

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    let title = 'An Error Occurred';
    let description = 'Something went wrong. Please try again.';

    if (error.message) {
      if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
        title = 'Rate Limit Exceeded';
        description = 'You have made too many requests. Please wait a while before trying again.';
      } else if (error.message.toLowerCase().includes('insufficient funds') || error.message.includes('402')) {
        title = 'Insufficient Funds';
        description = 'Your account has insufficient funds to perform this action.';
      } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('failed to fetch')) {
        title = 'Network Error';
        description = 'Could not connect to the AI service. Please check your internet connection.';
      }
    }
    toast.error(title, { description });
    setIsLoading(false);
  };

  const createNewChat = (isIncognito = false) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: isIncognito ? 'Incognito Chat' : 'New Chat',
      messages: [], createdAt: Date.now(), updatedAt: Date.now(), model: settings.textModel, isIncognito,
    };
    if (!isIncognito) {
      storage.addChat(newChat);
      setChats([newChat, ...chats]);
    }
    setCurrentChatId(newChat.id);
    if (!isIncognito) storage.setCurrentChatId(newChat.id);
    setMobileMenuOpen(false);
  };

  const handleSendMessage = async (content: string, imageData?: { imageUrl: string | string[]; prompt: string }) => {
    if (!currentChatId) return;
    const userMessage: Message = {
      id: Date.now().toString(), role: 'user', content, timestamp: Date.now(), imageUrl: imageData?.imageUrl,
    };
    const updatedChat = { ...currentChat!, messages: [...currentChat!.messages, userMessage] };
    if (!updatedChat.isIncognito) storage.updateChat(currentChatId, { messages: updatedChat.messages });
    setChats(chats.map(c => c.id === currentChatId ? updatedChat : c));
    setIsLoading(true);
    try {
      await handleTextChat(updatedChat.messages, currentChatId);
    } catch (error) {
      handleError(error, 'handleSendMessage');
    }
  };

  const parseResponse = (fullResponse: string, detectedTriggers: Trigger[]) => {
    let content = fullResponse, metadata: any = null;
    const match = fullResponse.match(/\n(\[\{.*\}\])$/s);
    if (match?.[1]) {
      try {
        metadata = JSON.parse(match[1]);
        content = fullResponse.replace(match[0], '').trim();
      } catch { /* Ignore */ }
    }
    return { content, metadata, rawContent: fullResponse, triggers: detectedTriggers };
  };
  
  const handleTextChat = async (messages: Message[], chatId: string) => {
    const lastUser = messages.slice().reverse().find(m => m.role === 'user');
    const { systemPrompt, detectedTriggers } = detectTriggersAndBuildPrompt(lastUser?.content || '');
    const modelId = settings.textModel;
    const controller = new AbortController();
    setAbortController(controller);

    const responseHandler = async (responseStream: ReadableStream<Uint8Array>) => {
      let fullResponse = '';
      const assistantMessage: Message = { id: Date.now().toString(), role: 'assistant', content: '', timestamp: Date.now() };
      const reader = responseStream.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;
        fullResponse += decoder.decode(value, { stream: true });
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
          const currentMessages = [...messages, { ...assistantMessage, content: fullResponse }];
          if (!chat.isIncognito) storage.updateChat(chatId, { messages: currentMessages });
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: currentMessages } : c));
        }
      }
      const finalChat = chats.find(c => c.id === chatId);
      if (finalChat) {
        const { content, metadata, rawContent, triggers } = parseResponse(fullResponse, detectedTriggers);
        const finalAssistantMessage: Message = { ...assistantMessage, content, metadata, rawContent, triggers };
        const finalMessages = [...messages, finalAssistantMessage];
        if (!finalChat.isIncognito) storage.updateChat(chatId, { messages: finalMessages });
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: finalMessages } : c));
      }
    };

    try {
      if (modelId.startsWith('openrouter/')) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-chat`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))], model: modelId.replace('openrouter:',''), temperature: settings.temperature, max_tokens: settings.maxTokens }),
        });
        if (!response.body) throw new Error('Empty response body');
        await responseHandler(response.body);
      } else {
        const puter = (window as any)?.puter;
        if (!puter?.ai?.chat) throw new Error('Puter AI not available');
        const response = await puter.ai.chat([{ role: 'system', content: systemPrompt }, ...messages.map(m => ({ role: m.role, content: m.content }))], { model: modelId, stream: settings.enableStreaming, temperature: settings.temperature, max_tokens: settings.maxTokens });
        await responseHandler(response);
      }
    } catch (error) {
      handleError(error, 'handleTextChat');
    } finally {
      setAbortController(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      <MotionBackground />
      <Header showMenuButton={true} onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} user={user} onSignOut={signOut} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className={cn('fixed inset-y-0 left-0 z-40 w-72 md:w-auto md:static md:translate-x-0 transition-all', mobileMenuOpen ? 'translate-x-0' : '-translate-x-full')}><ChatSidebar chats={chats} currentChatId={currentChatId} onNewChat={createNewChat} onNewIncognitoChat={() => createNewChat(true)} onSelectChat={(id) => { setCurrentChatId(id); if(!chats.find(c=>c.id===id)?.isIncognito) storage.setCurrentChatId(id); setCurrentView('chat'); setMobileMenuOpen(false); }} onDeleteChat={async (id) => {const newChats = chats.filter(c => c.id !== id); setChats(newChats); storage.saveChats(newChats);}} onNavigate={(view) => { setCurrentView(view); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}/></div>
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {currentView === 'chat' && (
            <>
              <ChatArea chat={currentChat} onSendMessage={handleSendMessage} onUpdateTitle={(id, title) => {const newChats = chats.map(c => c.id === id ? {...c, title} : c); setChats(newChats); storage.updateChat(id, {title});}} onDeleteChat={async (id) => {const newChats = chats.filter(c => c.id !== id); setChats(newChats); storage.saveChats(newChats);}} onRegenerateMessage={(id) => {}} onEditMessage={(id, content) => {}} isLoading={isLoading} onStopGeneration={() => abortController?.abort()} />
              {lastMessage && lastMessage.role === 'assistant' && lastMessage.triggers && lastMessage.triggers.length > 0 && (
                <TriggerBar
                  triggers={lastMessage.triggers}
                  metadata={lastMessage.metadata}
                  rawContent={lastMessage.rawContent}
                />
              )}
            </>
          )}
          <Suspense fallback={<Loader2 className="m-auto animate-spin" />}>
            {currentView === 'settings' && <SettingsPanel settings={settings} onUpdateSettings={(s) => {setSettings(s); storage.saveSettings(s);}} onClearAllData={() => {localStorage.clear(); setChats([]); setCurrentChatId(null);}} onExportChats={storage.exportChats} onImportChats={(file) => storage.importChats(file).then(() => setChats(storage.getChats()))}/>}
            {currentView === 'images' && <ImagesGallery />}
            {currentView === 'logs' && <LogCenter />}
            {currentView === 'triggers' && <TriggerGallery />}
            {currentView === 'bots' && <CustomBotsPanel />}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
