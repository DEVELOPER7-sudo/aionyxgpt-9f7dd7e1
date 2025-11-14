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
  Sparkles,
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

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn(
        'h-screen bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/10 flex flex-col transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between backdrop-blur-sm">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">OnyxGPT</h2>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="hover:bg-white/10 text-white/80"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-medium shadow-lg glow-blue"
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
            className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-primary/50"
          />
        </div>
      )}

      {/* Chats List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {filteredChats.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {!collapsed && <p className="text-sm text-center">No chats yet</p>}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                  currentChatId === chat.id 
                    ? 'bg-gradient-to-r from-primary/20 to-purple-600/20 border border-primary/30 glow-blue shadow-lg shadow-primary/10' 
                    : 'hover:bg-white/5 border border-transparent'
                )}
                onClick={() => onSelectChat(chat.id)}
              >
                <MessageSquare className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  currentChatId === chat.id ? 'text-primary' : 'text-white/60 group-hover:text-white/80'
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-sm text-white/80 group-hover:text-white transition-colors">{chat.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
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
            ))
          )}
        </div>
      </ScrollArea>

      {/* Navigation */}
      <div className="border-t border-white/10 p-2 space-y-1 backdrop-blur-sm">
        <NavButton
          icon={<Image className="w-5 h-5" />}
          label="Images"
          onClick={() => onNavigate('images')}
          collapsed={collapsed}
        />
        <NavButton
          icon={<Brain className="w-5 h-5" />}
          label="Memory"
          onClick={() => onNavigate('memory')}
          collapsed={collapsed}
        />
        <NavButton
          icon={<Search className="w-5 h-5" />}
          label="Search"
          onClick={() => onNavigate('search')}
          collapsed={collapsed}
        />
        <NavButton
          icon={<Zap className="w-5 h-5" />}
          label="Triggers"
          onClick={() => onNavigate('triggers')}
          collapsed={collapsed}
        />
        <NavButton
          icon={<Bot className="w-5 h-5" />}
          label="Custom Bots"
          onClick={() => onNavigate('bots')}
          collapsed={collapsed}
        />
        <NavButton
          icon={<FileText className="w-5 h-5" />}
          label="Logs"
          onClick={() => onNavigate('logs')}
          collapsed={collapsed}
        />
        <NavButton
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
          onClick={() => onNavigate('settings')}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  collapsed: boolean;
}

const NavButton = ({ icon, label, onClick, collapsed }: NavButtonProps) => (
  <Button
    variant="ghost"
    className="w-full justify-start hover:bg-white/10 text-white/80 hover:text-white transition-all duration-200"
    size={collapsed ? 'icon' : 'default'}
    onClick={onClick}
  >
    {icon}
    {!collapsed && <span className="ml-3">{label}</span>}
  </Button>
);

export default ChatSidebar;
