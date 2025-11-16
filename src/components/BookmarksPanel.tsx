import { useState, useEffect } from 'react';
import { Star, Trash2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBookmarks } from '@/hooks/useFeatures';
import { toast } from 'sonner';

export const BookmarksPanel = () => {
  const { bookmarks, loadBookmarks, removeBookmark } = useBookmarks();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadBookmarks();
      setLoading(false);
    };
    load();
  }, [loadBookmarks]);

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.message_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (bookmarkId: string, messageId: string) => {
    try {
      await removeBookmark(messageId);
      toast.success('Bookmark deleted');
    } catch {
      toast.error('Failed to delete bookmark');
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Star size={18} className="fill-yellow-400 text-yellow-400" />
          Bookmarks
        </h2>
        <Input
          placeholder="Search bookmarks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading bookmarks...
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            <Star size={24} className="mb-2 opacity-50" />
            <p>No bookmarks yet</p>
            <p className="text-xs">Click the star icon on messages to bookmark them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="p-2 rounded-md border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {bookmark.note && (
                      <p className="text-sm font-medium line-clamp-2">{bookmark.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bookmark.id, bookmark.message_id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
