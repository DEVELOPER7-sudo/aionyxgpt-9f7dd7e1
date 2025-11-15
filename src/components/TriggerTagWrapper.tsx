import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface TriggerTagWrapperProps {
  tagName: string;
  content: string;
  category?: string;
}

const TriggerTagWrapper = ({ tagName, content, category }: TriggerTagWrapperProps) => {
  const getCategoryColor = (cat?: string) => {
    if (!cat) return 'border-gray-500/30 bg-gray-500/5';
    
    if (cat.includes('Reasoning')) return 'border-blue-500/30 bg-blue-500/5';
    if (cat.includes('Research')) return 'border-green-500/30 bg-green-500/5';
    if (cat.includes('Planning')) return 'border-purple-500/30 bg-purple-500/5';
    if (cat.includes('Communication')) return 'border-orange-500/30 bg-orange-500/5';
    return 'border-primary/30 bg-primary/5';
  };

  const getCategoryIcon = (cat?: string) => {
    if (!cat) return '⚡';
    if (cat.includes('Reasoning')) return '🧩';
    if (cat.includes('Research')) return '🔍';
    if (cat.includes('Planning')) return '📋';
    if (cat.includes('Communication')) return '✨';
    return '⚡';
  };

  const getBadgeColor = (cat?: string) => {
    if (!cat) return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    
    if (cat.includes('Reasoning')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (cat.includes('Research')) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (cat.includes('Planning')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    if (cat.includes('Communication')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  return (
    <Card className={cn(
      'my-4 p-4 border-2 transition-all duration-200 hover:shadow-lg overflow-hidden',
      getCategoryColor(category)
    )}>
      {/* Header with tag name and category */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-current/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryIcon(category)}</span>
          <div>
            <Badge 
              variant="outline" 
              className={cn('font-mono text-xs font-bold', getBadgeColor(category))}
            >
              &lt;{tagName}/&gt;
            </Badge>
            {category && (
              <p className="text-xs text-muted-foreground mt-1">
                {category}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content - Enhanced markdown rendering */}
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
            h2: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
            h3: ({node, ...props}) => <h4 className="text-sm font-semibold mt-2 mb-1" {...props} />,
            p: ({node, ...props}) => <p className="text-sm leading-relaxed" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 text-sm" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 text-sm" {...props} />,
            li: ({node, ...props}) => <li className="text-sm" {...props} />,
            code: ({node, className, ...props}) => 
              className ? 
                <code className="block bg-black/30 p-2 rounded text-xs font-mono overflow-x-auto" {...props} /> :
                <code className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-current/30 pl-3 italic opacity-80" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Footer - visual separator */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-current/20 opacity-70">
        <span className="text-xs font-mono text-muted-foreground">
          /{tagName}
        </span>
      </div>
    </Card>
  );
};

export default TriggerTagWrapper;
