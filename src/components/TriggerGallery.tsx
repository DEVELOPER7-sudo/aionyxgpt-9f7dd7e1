import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Edit,
  Power,
  RefreshCw,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getAllTriggers,
  addTrigger,
  updateTrigger,
  deleteTrigger,
  toggleTrigger,
  exportTriggers,
  importTriggers,
  resetToBuiltIn,
  Trigger,
} from '@/lib/triggers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TriggerGalleryProps {
  selectedTriggers?: string[];
  onTriggersChange?: (triggers: string[]) => void;
  isCompactMode?: boolean;
}

const TriggerGallery = ({ 
  selectedTriggers = [], 
  onTriggersChange,
  isCompactMode = false 
}: TriggerGalleryProps) => {
  const [triggers, setTriggers] = useState<Trigger[]>(getAllTriggers());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);
  const [isNewTrigger, setIsNewTrigger] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    trigger: '',
    category: 'Reasoning & Analysis' as Trigger['category'],
    system_instruction: '',
    example: '',
    enabled: true,
  });

  const categories: Trigger['category'][] = [
    'Reasoning & Analysis',
    'Research & Information',
    'Planning & Organization',
    'Communication & Style',
  ];

  // Filter triggers
  const filteredTriggers = useMemo(() => {
    let filtered = triggers;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.trigger.toLowerCase().includes(query) ||
          t.system_instruction.toLowerCase().includes(query) ||
          t.example.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Enabled only filter
    if (showEnabledOnly) {
      filtered = filtered.filter(t => t.enabled);
    }

    return filtered;
  }, [triggers, searchQuery, categoryFilter, showEnabledOnly]);

  // Group by category
  const groupedTriggers = useMemo(() => {
    const groups: Record<string, Trigger[]> = {};
    filteredTriggers.forEach(trigger => {
      if (!groups[trigger.category]) {
        groups[trigger.category] = [];
      }
      groups[trigger.category].push(trigger);
    });
    return groups;
  }, [filteredTriggers]);

  const refreshTriggers = () => {
    setTriggers(getAllTriggers());
  };

  const handleAddNew = () => {
    setIsNewTrigger(true);
    setEditingTrigger(null);
    setFormData({
      trigger: '',
      category: 'Reasoning & Analysis',
      system_instruction: '',
      example: '',
      enabled: true,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (trigger: Trigger) => {
    setIsNewTrigger(false);
    setEditingTrigger(trigger);
    setFormData({
      trigger: trigger.trigger,
      category: trigger.category,
      system_instruction: trigger.system_instruction,
      example: trigger.example,
      enabled: trigger.enabled,
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    try {
      if (!formData.trigger.trim()) {
        toast.error('Trigger name is required');
        return;
      }
      if (!formData.system_instruction.trim()) {
        toast.error('System instruction is required');
        return;
      }

      const newTrigger: Trigger = {
        trigger: formData.trigger.trim(),
        category: formData.category,
        system_instruction: formData.system_instruction.trim(),
        example: formData.example.trim(),
        enabled: formData.enabled,
        custom: true,
      };

      if (isNewTrigger) {
        addTrigger(newTrigger);
        toast.success('Trigger added successfully');
      } else {
        updateTrigger(editingTrigger!.trigger, newTrigger);
        toast.success('Trigger updated successfully');
      }

      refreshTriggers();
      setEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save trigger');
    }
  };

  const handleDelete = (triggerName: string, isCustom: boolean) => {
    if (!isCustom) {
      toast.error('Cannot delete built-in triggers');
      return;
    }
    deleteTrigger(triggerName);
    toast.success('Trigger deleted');
    refreshTriggers();
  };

  const handleToggle = (triggerName: string) => {
    toggleTrigger(triggerName);
    refreshTriggers();
  };

  const handleExport = () => {
    exportTriggers();
    toast.success('Triggers exported successfully');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importTriggers(file);
      refreshTriggers();
      toast.success('Triggers imported successfully');
    } catch (error) {
      toast.error('Failed to import triggers');
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Reset all triggers to built-in defaults? This will remove all custom triggers.')) {
      resetToBuiltIn();
      refreshTriggers();
      toast.success('Triggers reset to defaults');
    }
  };

  const getCategoryColor = (category: Trigger['category']) => {
    switch (category) {
      case 'Reasoning & Analysis':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Research & Information':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Planning & Organization':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Communication & Style':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const toggleTriggerSelection = (triggerName: string) => {
    if (!onTriggersChange) return;
    if (selectedTriggers.includes(triggerName)) {
      onTriggersChange(selectedTriggers.filter(t => t !== triggerName));
    } else {
      onTriggersChange([...selectedTriggers, triggerName]);
    }
  };

  // Compact mode for ChatArea
  if (isCompactMode && onTriggersChange) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2',
            selectedTriggers.length > 0 && 'border-primary bg-primary/5'
          )}
          onClick={() => setGalleryOpen(true)}
        >
          <Search className="w-4 h-4" />
          Trigger Gallery
          {selectedTriggers.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {selectedTriggers.length}
            </Badge>
          )}
        </Button>

        {/* Selected Triggers Pills */}
        {selectedTriggers.map(triggerName => {
          const trigger = triggers.find(t => t.trigger === triggerName);
          if (!trigger) return null;
          return (
            <Badge
              key={triggerName}
              className={cn(
                'gap-1 cursor-pointer',
                getCategoryColor(trigger.category)
              )}
              onClick={() => toggleTriggerSelection(triggerName)}
            >
              {trigger.trigger}
              <X className="w-3 h-3" />
            </Badge>
          );
        })}

        {/* Gallery Dialog */}
        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Trigger Gallery</DialogTitle>
              <DialogDescription>
                Select triggers to apply to your message
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Filters */}
              <div className="flex gap-2 p-4 border-b border-border flex-shrink-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search triggers..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trigger Cards */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {Object.keys(groupedTriggers).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No triggers found
                    </div>
                  ) : (
                    Object.entries(groupedTriggers).map(([category, categoryTriggers]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold mb-2">
                          <Badge className={getCategoryColor(category as Trigger['category'])}>
                            {category}
                          </Badge>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {categoryTriggers.map(trigger => {
                            const isSelected = selectedTriggers.includes(trigger.trigger);
                            return (
                              <button
                                key={trigger.trigger}
                                onClick={() => toggleTriggerSelection(trigger.trigger)}
                                className={cn(
                                  'text-left p-3 rounded-lg border transition-all text-sm',
                                  'hover:shadow-sm',
                                  isSelected
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{trigger.trigger}</span>
                                  {isSelected && (
                                    <Badge variant="default" className="text-xs">
                                      ✓
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {trigger.system_instruction.replace(/Use tags.*?final_response\.\s*/i, '')}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Full admin mode
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Trigger Gallery</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage AI behavior triggers and system instructions
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
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleAddNew} className="glow-blue">
              <Plus className="w-4 h-4 mr-2" />
              Add Trigger
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search triggers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showEnabledOnly ? 'default' : 'outline'}
            onClick={() => setShowEnabledOnly(!showEnabledOnly)}
          >
            <Power className="w-4 h-4 mr-2" />
            Enabled Only
          </Button>
        </div>
      </div>

      {/* Trigger Cards */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {Object.keys(groupedTriggers).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No triggers found
            </div>
          ) : (
            Object.entries(groupedTriggers).map(([category, categoryTriggers]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge className={getCategoryColor(category as Trigger['category'])}>
                    {category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({categoryTriggers.length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTriggers.map(trigger => (
                    <Card
                      key={trigger.trigger}
                      className={cn(
                        'p-4 transition-all hover:shadow-lg',
                        !trigger.enabled && 'opacity-50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">
                            {trigger.trigger}
                            {trigger.custom && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Custom
                              </Badge>
                            )}
                          </h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-8 w-8 flex-shrink-0',
                            trigger.enabled ? 'text-green-500' : 'text-gray-400'
                          )}
                          onClick={() => handleToggle(trigger.trigger)}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {trigger.system_instruction}
                      </p>

                      <div className="bg-muted/50 rounded p-2 mb-3">
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          {trigger.example}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(trigger)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {trigger.custom && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(trigger.trigger, trigger.custom!)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isNewTrigger ? 'Add New Trigger' : 'Edit Trigger'}
            </DialogTitle>
            <DialogDescription>
              {isNewTrigger
                ? 'Create a custom trigger with system instructions'
                : 'Modify trigger settings and instructions'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="trigger">Trigger Keyword/Phrase *</Label>
              <Input
                id="trigger"
                value={formData.trigger}
                onChange={e => setFormData({ ...formData, trigger: e.target.value })}
                placeholder="e.g., deep research"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as Trigger['category'] })
                }
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
              <Label htmlFor="instruction">System Instruction *</Label>
              <Textarea
                id="instruction"
                value={formData.system_instruction}
                onChange={e =>
                  setFormData({ ...formData, system_instruction: e.target.value })
                }
                placeholder="Describe how the AI should behave when this trigger is detected..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="example">Example Use Case</Label>
              <Input
                id="example"
                value={formData.example}
                onChange={e => setFormData({ ...formData, example: e.target.value })}
                placeholder='e.g., Use "deep research" to investigate complex topics'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="glow-blue">
              {isNewTrigger ? 'Add Trigger' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TriggerGallery;
