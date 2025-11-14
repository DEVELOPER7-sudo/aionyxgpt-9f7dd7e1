import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogEntry {
  id: string;
  type: 'info' | 'error' | 'warning' | 'api';
  message: string;
  timestamp: number;
  details?: any;
}

const LogCenter = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Load logs from localStorage
    const savedLogs = localStorage.getItem('app_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    // Intercept console methods
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args: any[]) => {
      originalConsoleLog(...args);
      addLog('info', args.join(' '), args);
    };

    console.error = (...args: any[]) => {
      originalConsoleError(...args);
      addLog('error', args.join(' '), args);
    };

    console.warn = (...args: any[]) => {
      originalConsoleWarn(...args);
      addLog('warning', args.join(' '), args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const sanitizeLog = (log: any): LogEntry => {
    // Sanitize to prevent sensitive data exposure
    const sanitized = { ...log };
    
    // Remove potentially sensitive keys from details
    if (sanitized.details) {
      if (typeof sanitized.details === 'object') {
        const sensitiveKeys = ['password', 'apiKey', 'api_key', 'token', 'auth', 'secret', 'access_token'];
        Object.keys(sanitized.details).forEach(key => {
          if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
            sanitized.details[key] = '[REDACTED]';
          }
        });
      }
    }
    
    // Truncate message if too long
    if (sanitized.message && sanitized.message.length > 1000) {
      sanitized.message = sanitized.message.substring(0, 1000) + '...[truncated]';
    }
    
    return sanitized;
  };

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      type,
      message: message.substring(0, 1000), // Limit message length
      timestamp: Date.now(),
      details,
    };

    setLogs((prev) => {
      const sanitized = sanitizeLog(newLog);
      const updated = [sanitized, ...prev].slice(0, 500); // Keep last 500 logs
      try {
        localStorage.setItem('app_logs', JSON.stringify(updated));
      } catch (e) {
        // If localStorage is full, clear old logs
        console.warn('localStorage full, clearing old logs');
        localStorage.removeItem('app_logs');
        localStorage.setItem('app_logs', JSON.stringify(updated.slice(0, 100)));
      }
      return updated;
    });
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      setLogs([]);
      localStorage.removeItem('app_logs');
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `onyxgpt-logs-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'api':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="max-w-6xl mx-auto p-3 md:p-6 h-full flex flex-col">
        <div className="space-y-2 mb-4">
          <h1 className="text-3xl font-bold">Log Center</h1>
          <p className="text-muted-foreground">View application logs, errors, and API requests</p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Logs ({logs.length})</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                  <SelectItem value="warning">Warnings</SelectItem>
                  <SelectItem value="api">API Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Logs */}
          <ScrollArea className="flex-1 p-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg">No logs yet</p>
                <p className="text-sm mt-2">Application logs will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getTypeColor(log.type)} className="text-xs">
                            {log.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm break-words font-mono">{log.message}</p>
                        {log.details && typeof log.details === 'object' && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-auto max-h-48">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default LogCenter;
