import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetectedTrigger } from '@/lib/triggers';

interface TriggerBarProps {
  triggers: DetectedTrigger[];
  taggedSegments?: Array<{ tag: string; content: string }>;
  onTriggerClick?: (trigger: DetectedTrigger) => void;
}

const TriggerBar = ({ triggers, taggedSegments = [], onTriggerClick }: TriggerBarProps) => {
  const [expandedTriggers, setExpandedTriggers] = useState<Set<string>>(new Set());
  const [viewAll, setViewAll] = useState(false);
  const [isBarCollapsed, setIsBarCollapsed] = useState(false);

  if (triggers.length === 0) return null;

  const toggleTrigger = (triggerTag: string) => {
    const newExpanded = new Set(expandedTriggers);
    if (newExpanded.has(triggerTag)) {
      newExpanded.delete(triggerTag);
    } else {
      newExpanded.add(triggerTag);
    }
    setExpandedTriggers(newExpanded);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Reasoning & Analysis':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/20';
      case 'Research & Information':
        return 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20';
      case 'Planning & Organization':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500/20';
      case 'Communication & Style':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30 hover:bg-gray-500/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Reasoning & Analysis':
        return '🧩';
      case 'Research & Information':
        return '🔍';
      case 'Planning & Organization':
        return '📋';
      case 'Communication & Style':
        return '✨';
      default:
        return '⚡';
    }
  };

  return (
    <Card className="mb-4 bg-gradient-to-r from-background/50 to-background border-2 border-primary/20 shadow-lg">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Active Triggers ({triggers.length})
          </span>
        </div>
        <div className="flex gap-2">
          {triggers.length > 1 && !isBarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewAll(!viewAll)}
              className="h-7 text-xs"
            >
              {viewAll ? 'Collapse All' : 'View All'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBarCollapsed(!isBarCollapsed)}
            className="h-7 text-xs"
          >
            {isBarCollapsed ? '▼' : '▲'}
          </Button>
        </div>
      </div>

      {!isBarCollapsed && (
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          {triggers.map((trigger) => {
            const isExpanded = expandedTriggers.has(trigger.tag) || viewAll;
            const matchingSegment = taggedSegments.find(seg => seg.tag === trigger.tag);
            
            return (
              <Collapsible
                key={trigger.tag}
                open={isExpanded}
                onOpenChange={() => toggleTrigger(trigger.tag)}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <Badge
                    className={cn(
                      'cursor-pointer transition-all duration-200 px-3 py-1.5 text-xs font-medium border',
                      getCategoryColor(trigger.category)
                    )}
                    onClick={() => onTriggerClick?.(trigger)}
                  >
                    <span className="mr-1.5">{getCategoryIcon(trigger.category)}</span>
                    {trigger.name}
                    {isExpanded ? (
                      <ChevronUp className="ml-1.5 w-3 h-3" />
                    ) : (
                      <ChevronDown className="ml-1.5 w-3 h-3" />
                    )}
                  </Badge>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2">
                  <Card className="p-3 bg-muted/30 border-l-4" style={{
                    borderLeftColor: getCategoryColor(trigger.category).includes('blue') ? '#3b82f6' :
                      getCategoryColor(trigger.category).includes('green') ? '#10b981' :
                      getCategoryColor(trigger.category).includes('purple') ? '#a855f7' :
                      getCategoryColor(trigger.category).includes('orange') ? '#f97316' : '#6b7280'
                  }}>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">Category:</span>
                        <span className="ml-2 text-muted-foreground">{trigger.category}</span>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-foreground">Purpose:</span>
                        <p className="mt-1 text-muted-foreground">{trigger.metadata.purpose}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-foreground">Context Used:</span>
                        <p className="mt-1 text-muted-foreground">{trigger.metadata.context_used}</p>
                      </div>

                      <div>
                        <span className="font-semibold text-foreground">Influence Scope:</span>
                        <p className="mt-1 text-muted-foreground">{trigger.metadata.influence_scope}</p>
                      </div>

                      {matchingSegment && (
                        <div>
                          <span className="font-semibold text-foreground">Tagged Content Preview:</span>
                          <div className="mt-1 p-2 bg-background/50 rounded border border-border">
                            <p className="text-muted-foreground line-clamp-3">
                              {matchingSegment.content.substring(0, 200)}
                              {matchingSegment.content.length > 200 && '...'}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="font-semibold text-foreground">System Instruction:</span>
                        <div className="mt-1 p-2 bg-background/50 rounded border border-border font-mono">
                          <code className="text-xs text-muted-foreground">{trigger.instruction}</code>
                        </div>
                      </div>
                    </div>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default TriggerBar;
