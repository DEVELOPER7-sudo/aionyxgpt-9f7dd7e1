import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { advancedSearch, saveSearchQuery } from '@/lib/features';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChatSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatSearchDialog = ({ open, onOpenChange }: ChatSearchDialogProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!user || !query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await advancedSearch(user.id, {
        query,
        limit: 50,
      });

      setResults(searchResults.results);
      saveSearchQuery(user.id, query, {});
      toast.success(`Found ${searchResults.results.length} results`);
    } catch (error) {
      toast.error('Search failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Chats</DialogTitle>
          <DialogDescription>Search through your chat history by keywords</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              <Search size={18} />
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  {query ? 'No results found' : 'Type to search'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="p-3 border border-border rounded-md hover:bg-accent/50 cursor-pointer transition-colors">
                    <p className="text-sm line-clamp-2">{result.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.model} • {new Date(result.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
