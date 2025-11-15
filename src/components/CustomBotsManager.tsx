import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Bot,
  Globe,
  Lock,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CustomBot } from '@/types/chat';
import {
  getAllBots,
  addBot,
  updateBot,
  deleteBot,
  exportBots,
  importBots,
  incrementBotUsage,
} from '@/lib/custom-bots';

interface CustomBotsManagerProps {
  onSelectBot?: (bot: CustomBot) => void;
}

const CustomBotsManager = ({ onSelectBot }: CustomBotsManagerProps) => {
  const [bots, setBots] = useState<CustomBot[]>(getAllBots());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<CustomBot | null>(null);
  const [filterPublic, setFilterPublic] = useState<'all' | 'public' | 'private'>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    logo: '',
    category: 'General',
    isPublic: true,
  });

  const categories = [
    'General',
    'Coding',
    'Writing',
    'Research',
    'Education',
    'Business',
    'Creative',
    'Entertainment',
    'Other',
  ];

  const refreshBots = () => {
    setBots(getAllBots());
  };

  const handleAddNew = () => {
    setEditingBot(null);
    setFormData({
      name: '',
      description: '',
      systemPrompt: '',
      logo: '',
      category: 'General',
      isPublic: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (bot: CustomBot) => {
    setEditingBot(bot);
    setFormData({
      name: bot.name,
      description: bot.description,
      systemPrompt: bot.systemPrompt,
      logo: bot.logo || '',
      category: bot.category || 'General',
      isPublic: bot.isPublic,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Bot name is required');
        return;
      }
      if (!formData.systemPrompt.trim()) {
        toast.error('System prompt is required');
        return;
      }

      if (editingBot) {
        updateBot(editingBot.id, {
          name: formData.name,
          description: formData.description,
          systemPrompt: formData.systemPrompt,
          logo: formData.logo || undefined,
          category: formData.category,
          isPublic: formData.isPublic,
        });
        toast.success('Bot updated successfully');
      } else {
        addBot({
          name: formData.name,
          description: formData.description,
          systemPrompt: formData.systemPrompt,
          logo: formData.logo || undefined,
          category: formData.category,
          isPublic: formData.isPublic,
        });
        toast.success('Bot created successfully');
      }

      refreshBots();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save bot');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this bot?')) {
      deleteBot(id);
      toast.success('Bot deleted');
      refreshBots();
    }
  };

  const handleUseBot = (bot: CustomBot) => {
    incrementBotUsage(bot.id);
    refreshBots();
    onSelectBot?.(bot);
    toast.success(`Using ${bot.name}`);
  };

  const handleExport = () => {
    exportBots();
    toast.success('Bots exported successfully');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importBots(file);
      refreshBots();
      toast.success('Bots imported successfully');
    } catch (error) {
      toast.error('Failed to import bots');
    }
    e.target.value = '';
  };

  const filteredBots = bots.filter(bot => {
    if (filterPublic === 'public') return bot.isPublic;
    if (filterPublic === 'private') return !bot.isPublic;
    return true;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Custom Bots
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage your AI-powered custom bots
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>
            <Button onClick={handleAddNew} className="glow-blue">
              <Plus className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filterPublic === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPublic('all')}
          >
            All ({bots.length})
          </Button>
          <Button
            variant={filterPublic === 'public' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPublic('public')}
          >
            <Globe className="w-3 h-3 mr-1" />
            Public ({bots.filter(b => b.isPublic).length})
          </Button>
          <Button
            variant={filterPublic === 'private' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterPublic('private')}
          >
            <Lock className="w-3 h-3 mr-1" />
            Private ({bots.filter(b => !b.isPublic).length})
          </Button>
        </div>
      </div>

      {/* Bot Cards */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredBots.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No custom bots yet. Create your first one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBots.map(bot => (
                <Card
                  key={bot.id}
                  className={cn(
                    "p-5 hover:shadow-xl transition-all border-2 rounded-xl overflow-hidden",
                    "relative before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0",
                    "hover:before:opacity-5 before:transition-opacity",
                    bot.isPublic 
                      ? "border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5" 
                      : "border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5"
                  )}
                >
                  {/* Header with Logo and Badge */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        {bot.logo ? (
                          <img src={bot.logo} alt={bot.name} className="w-14 h-14 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className={cn(
                            "w-14 h-14 rounded-lg flex items-center justify-center border border-border",
                            "bg-gradient-to-br",
                            bot.isPublic 
                              ? "from-green-500/20 to-green-600/10"
                              : "from-purple-500/20 to-purple-600/10"
                          )}>
                            <Bot className={cn(
                              "w-7 h-7",
                              bot.isPublic ? "text-green-600" : "text-purple-600"
                            )} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{bot.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              bot.isPublic 
                                ? "bg-green-500/10 text-green-700 border-green-500/30"
                                : "bg-purple-500/10 text-purple-700 border-purple-500/30"
                            )}
                          >
                            {bot.category}
                          </Badge>
                          <Badge 
                            variant={bot.isPublic ? 'default' : 'secondary'} 
                            className={cn(
                              "text-xs gap-1",
                              bot.isPublic 
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-purple-600 hover:bg-purple-700"
                            )}
                          >
                            {bot.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {bot.description || 'No description provided'}
                  </p>

                  {/* System Prompt Preview */}
                  <div className={cn(
                    "rounded-lg p-3 mb-4 text-xs border",
                    bot.isPublic
                      ? "bg-green-50/50 dark:bg-green-950/20 border-green-500/20"
                      : "bg-purple-50/50 dark:bg-purple-950/20 border-purple-500/20"
                  )}>
                    <p className="text-muted-foreground font-mono line-clamp-2">
                      {bot.systemPrompt}
                    </p>
                  </div>

                  {/* Stats Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {bot.usageCount || 0} uses
                      </span>
                      <span>{new Date(bot.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 relative z-10">
                    <Button
                      size="sm"
                      className={cn(
                        "flex-1",
                        bot.isPublic
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-purple-600 hover:bg-purple-700"
                      )}
                      onClick={() => handleUseBot(bot)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Use
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(bot)}
                      className="hover:border-primary hover:text-primary"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:border-destructive"
                      onClick={() => handleDelete(bot.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBot ? 'Edit Custom Bot' : 'Create Custom Bot'}
            </DialogTitle>
            <DialogDescription>
              {editingBot
                ? 'Modify your custom bot settings'
                : 'Create a new AI bot with custom system prompts'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Bot Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Code Helper Pro"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this bot does"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="logo">Logo URL (optional)</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={e => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="systemPrompt">System Prompt *</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="You are a helpful assistant specialized in..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This prompt defines the bot's behavior and personality
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublic">Make Public</Label>
                <p className="text-xs text-muted-foreground">
                  Allow others to discover and use this bot
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="glow-blue">
              {editingBot ? 'Save Changes' : 'Create Bot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomBotsManager;
