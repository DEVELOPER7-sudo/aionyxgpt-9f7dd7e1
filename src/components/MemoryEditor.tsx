import { useState } from 'react';
import { storage } from '@/lib/storage';
import { Memory } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Save, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const memorySchema = z.object({
  key: z.string()
    .trim()
    .min(1, 'Key cannot be empty')
    .max(100, 'Key must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Only letters, numbers, spaces, hyphens, and underscores allowed'),
  value: z.string()
    .trim()
    .min(1, 'Value cannot be empty')
    .max(2000, 'Value must be less than 2000 characters')
});

const MemoryEditor = () => {
  const [memories, setMemories] = useState<Memory[]>(storage.getMemories());
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const result = memorySchema.safeParse({ key: newKey, value: newValue });
    
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    const memory: Memory = {
      id: Date.now().toString(),
      key: result.data.key,
      value: result.data.value,
      timestamp: Date.now(),
    };

    storage.addMemory(memory);
    setMemories([...memories, memory]);
    setNewKey('');
    setNewValue('');
    toast.success('Memory added');
  };

  const handleUpdate = (id: string, key: string, value: string) => {
    const result = memorySchema.safeParse({ key, value });
    
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    storage.updateMemory(id, { key: result.data.key, value: result.data.value });
    setMemories(memories.map(m => m.id === id ? { ...m, key: result.data.key, value: result.data.value } : m));
    setEditingId(null);
    toast.success('Memory updated');
  };

  const handleDelete = (id: string) => {
    storage.deleteMemory(id);
    setMemories(memories.filter(m => m.id !== id));
    toast.success('Memory deleted');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border p-4 animate-fadeIn">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Memory Editor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Store information about yourself that the AI can remember across conversations
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Card className="p-4 mb-4 animate-slideUp glow-blue">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Memory
          </h2>
          <div className="space-y-3">
            <Input
              placeholder="Key (e.g., 'Favorite Color', 'Job Title')"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <Textarea
              placeholder="Value (e.g., 'Blue', 'Software Engineer')"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={2}
            />
            <Button onClick={handleAdd} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {memories.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">No memories stored yet</p>
            </div>
          ) : (
            memories.map((memory) => (
              <Card key={memory.id} className="p-4 animate-slideUp hover:shadow-lg transition-all">
                {editingId === memory.id ? (
                  <div className="space-y-3">
                    <Input
                      defaultValue={memory.key}
                      id={`key-${memory.id}`}
                    />
                    <Textarea
                      defaultValue={memory.value}
                      id={`value-${memory.id}`}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const key = (document.getElementById(`key-${memory.id}`) as HTMLInputElement).value;
                          const value = (document.getElementById(`value-${memory.id}`) as HTMLTextAreaElement).value;
                          handleUpdate(memory.id, key, value);
                        }}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm badge-blue">{memory.key}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{memory.value}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(memory.id)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(memory.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryEditor;
