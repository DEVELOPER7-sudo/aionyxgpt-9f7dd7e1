import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import LoadingDots from '@/components/LoadingDots';
import {
  Send,
  Mic,
  Image as ImageIcon,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Download,
  Edit2,
  Trash2,
  Loader2,
  Globe,
  Search as SearchIcon,
  Square,
  X,
} from 'lucide-react';
import { Chat, Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatAreaProps {
  chat: Chat | null;
  onSendMessage: (content: string) => void;
  onUpdateTitle: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRegenerateMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  webSearchEnabled: boolean;
  deepSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onToggleDeepSearch: () => void;
  currentModel?: string;
  taskMode?: 'standard' | 'reasoning' | 'research' | 'creative';
  onTaskModeChange?: (mode: 'standard' | 'reasoning' | 'research' | 'creative') => void;
}

const ChatArea = ({
  chat,
  onSendMessage,
  onUpdateTitle,
  onDeleteChat,
  onRegenerateMessage,
  onEditMessage,
  isLoading,
  onStopGeneration,
  webSearchEnabled,
  deepSearchEnabled,
  onToggleWebSearch,
  onToggleDeepSearch,
  currentModel = 'gpt-5-nano',
  taskMode = 'standard',
  onTaskModeChange,
}: ChatAreaProps) => {
  const [input, setInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  // Persist input drafts per chat to prevent accidental loss
  useEffect(() => {
    if (chat) {
      const draft = localStorage.getItem(`draft_${chat.id}`);
      if (draft) setInput(draft);
    }
  }, [chat?.id]);

  useEffect(() => {
    if (chat) {
      localStorage.setItem(`draft_${chat.id}`, input);
    }
  }, [chat?.id, input]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (isLoading) return;

    onSendMessage(input);
    setInput('');
    if (chat) localStorage.removeItem(`draft_${chat.id}`);
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const saveTitle = () => {
    if (chat && editedTitle.trim()) {
      // Validate title length
      if (editedTitle.length > 200) {
        toast.error('Title too long (max 200 characters)');
        return;
      }
      onUpdateTitle(chat.id, editedTitle);
      setIsEditingTitle(false);
    }
  };

  const startEditingMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingMessageContent(content);
  };

  const saveEditedMessage = () => {
    if (editingMessageId && editingMessageContent.trim()) {
      onEditMessage(editingMessageId, editingMessageContent);
      setEditingMessageId(null);
      setEditingMessageContent('');
    }
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">No chat selected</h3>
          <p className="text-muted-foreground">Start a new chat or select an existing one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-3 md:p-4 flex items-center justify-between bg-card/50 backdrop-blur-sm flex-shrink-0 z-10">
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyPress={(e) => e.key === 'Enter' && saveTitle()}
              className="max-w-md"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-semibold truncate">{chat.title}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => {
                  setEditedTitle(chat.title);
                  setIsEditingTitle(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
            onClick={() => {
              const data = JSON.stringify(chat, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${chat.title}.json`;
              a.click();
              toast.success('Chat exported');
            }}
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10 hover:text-destructive"
            onClick={() => onDeleteChat(chat.id)}
          >
            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-4 pb-4">{chat.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-scale-in w-full',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[90%] sm:max-w-[85%] min-w-0 rounded-2xl p-3 md:p-4 shadow-lg',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border'
                )}
              >
                {message.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={message.imageUrl}
                      alt={message.imagePrompt || 'Generated image'}
                      className="rounded-lg max-w-full h-auto"
                    />
                    {message.imagePrompt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Prompt: {message.imagePrompt}
                      </p>
                    )}
                  </div>
                )}
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none min-w-0 overflow-hidden">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : editingMessageId === message.id ? (
                  <div className="space-y-2 animate-scale-in">
                    <Textarea
                      value={editingMessageContent}
                      onChange={(e) => setEditingMessageContent(e.target.value)}
                      className="min-h-[100px] bg-background/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveEditedMessage}
                        disabled={isLoading}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        Save & Regenerate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingMessage}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {message.content}
                  </p>
                )}
                {message.role === 'assistant' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border animate-fade-in">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 transition-all duration-200 hover:scale-110"
                      onClick={() => copyToClipboard(message.content)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 transition-all duration-200 hover:scale-110">
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 transition-all duration-200 hover:scale-110">
                      <ThumbsDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 transition-all duration-200 hover:scale-110 hover:rotate-180"
                      onClick={() => onRegenerateMessage(message.id)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {message.role === 'user' && !editingMessageId && (
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs transition-all duration-200 hover:scale-105"
                      onClick={() => startEditingMessage(message.id, message.content)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Show loading spinner only when there isn't a streaming assistant message */}
          {(() => {
            const last = chat.messages[chat.messages.length - 1];
            const showSpinner = isLoading && !(last && last.role === 'assistant');
            return showSpinner ? (
              <div className="flex gap-3 animate-bounce-in items-start">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-lg flex items-center gap-3 animate-pulse-glow">
                  <LoadingDots />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onStopGeneration}
                    className="text-destructive hover:text-destructive"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-2 md:p-4 bg-card/50 backdrop-blur-sm flex-shrink-0 z-10 safe-bottom">
        <div className="max-w-4xl mx-auto space-y-2 md:space-y-3">
          {/* Input */}
          <div className="flex gap-1 md:gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message or /img for images..."
              className="flex-1 min-h-[60px] max-h-[150px] resize-none text-base"
              style={{ fontSize: '16px' }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
            >
              <Mic className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="h-10 w-10 flex-shrink-0"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </Button>
          </div>

          {/* Advanced Menu */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="gap-2"
            >
              <SearchIcon className="w-4 h-4" />
              Advanced
              {showAdvanced ? <X className="w-3 h-3" /> : null}
            </Button>
          </div>

          {/* Advanced Options Panel */}
          {showAdvanced && (
            <div className="border border-border rounded-lg p-3 bg-card/50 space-y-3 animate-scale-in">
              {onTaskModeChange && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="task-mode-adv" className="whitespace-nowrap text-xs min-w-[80px]">Task Mode:</Label>
                  <Select value={taskMode} onValueChange={(value: any) => onTaskModeChange(value)}>
                    <SelectTrigger id="task-mode-adv" className="h-8 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="reasoning">Reasoning</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="web-search-adv" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="w-4 h-4" />
                    Web Search
                  </Label>
                  <Switch
                    checked={webSearchEnabled}
                    onCheckedChange={onToggleWebSearch}
                    id="web-search-adv"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="deep-search-adv" className="flex items-center gap-2 cursor-pointer">
                    <SearchIcon className="w-4 h-4" />
                    Deep Search
                  </Label>
                  <Switch
                    checked={deepSearchEnabled}
                    onCheckedChange={onToggleDeepSearch}
                    id="deep-search-adv"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
