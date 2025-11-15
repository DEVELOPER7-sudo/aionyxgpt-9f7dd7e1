import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Image,
  Brain,
  Search,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  Zap,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Chat } from '@/types/chat';

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => Promise<void>;
  onNavigate: (section: 'images' | 'memory' | 'search' | 'settings' | 'logs' | 'triggers' | 'bots') => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const ChatSidebar = ({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => {
    const title = typeof chat.title === 'string' ? chat.title : 'Untitled Chat';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div
      className={cn(
        'h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-bold text-lg">OnyxGPT</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full glow-blue"
          size={collapsed ? 'icon' : 'default'}
        >
          <Plus className="w-5 h-5" />
          {!collapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-sidebar-accent border-sidebar-border"
          />
        </div>
      )}

      {/* Chats List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                'group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-all',
                currentChatId === chat.id && 'bg-sidebar-accent border border-primary/30 glow-blue'
              )}
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-sm">{chat.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Navigation */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => onNavigate('images')}
        >
          <Image className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Images</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => onNavigate('memory')}
        >
          <Brain className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Memory</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => onNavigate('search')}
        >
          <Search className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Search</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => onNavigate('triggers')}
        >
          <Zap className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Triggers</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => onNavigate('bots')}
        >
          <Bot className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Custom Bots</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => onNavigate('logs')}
        >
          <FileText className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Logs</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-sidebar-accent"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => onNavigate('settings')}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Settings</span>}
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
