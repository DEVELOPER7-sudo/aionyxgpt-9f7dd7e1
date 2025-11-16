import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBookmarks } from '@/hooks/useFeatures';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  messageId: string;
  className?: string;
}

export const BookmarkButton = ({ messageId, className = '' }: BookmarkButtonProps) => {
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const [isMarked, setIsMarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkBookmark = async () => {
      const marked = await isBookmarked(messageId);
      setIsMarked(marked);
    };
    checkBookmark();
  }, [messageId, isBookmarked]);

  const handleBookmark = async () => {
    setLoading(true);
    try {
      if (isMarked) {
        await removeBookmark(messageId);
        setIsMarked(false);
        toast.success('Bookmark removed');
      } else {
        await addBookmark(messageId);
        setIsMarked(true);
        toast.success('Message bookmarked');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          disabled={loading}
          title={isMarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Star
            size={18}
            className={isMarked ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleBookmark}>
          {isMarked ? 'Remove bookmark' : 'Add bookmark'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            handleBookmark();
          }}
        >
          {isMarked ? 'Remove from folder' : 'Add to folder'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
