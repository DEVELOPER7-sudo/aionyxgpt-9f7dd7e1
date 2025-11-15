interface PuterAPILog {
  method: string;
  model?: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

interface OpenRouterAPILog {
  method: string;
  model: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

interface LogEntry {
  id: string;
  type: 'info' | 'error' | 'warning' | 'api';
  message: string;
  timestamp: number;
  details?: any;
}

export const logPuterAPICall = (apiLog: PuterAPILog) => {
  const logEntry: LogEntry = {
    id: Date.now().toString(),
    type: 'api',
    message: `Puter API Call: ${apiLog.method}`,
    timestamp: apiLog.timestamp,
    details: {
      method: apiLog.method,
      model: apiLog.model,
      duration: apiLog.duration,
      success: apiLog.success,
      // Sensitive data (params, messages, response) removed for privacy
    },
  };

  // Get existing logs
  const savedLogs = localStorage.getItem('app_logs');
  const logs: LogEntry[] = savedLogs ? JSON.parse(savedLogs) : [];

  // Add new log
  const updatedLogs = [logEntry, ...logs].slice(0, 100); // Reduced to 100 entries
  localStorage.setItem('app_logs', JSON.stringify(updatedLogs));
};

export const logOpenRouterAPICall = (apiLog: OpenRouterAPILog) => {
  const logEntry: LogEntry = {
    id: Date.now().toString(),
    type: 'api',
    message: `OpenRouter API Call: ${apiLog.model}`,
    timestamp: apiLog.timestamp,
    details: {
      method: apiLog.method,
      model: apiLog.model,
      duration: apiLog.duration,
      success: apiLog.success,
      // Sensitive data (params, messages, response) removed for privacy
    },
  };

  // Get existing logs
  const savedLogs = localStorage.getItem('app_logs');
  const logs: LogEntry[] = savedLogs ? JSON.parse(savedLogs) : [];

  // Add new log
  const updatedLogs = [logEntry, ...logs].slice(0, 100); // Reduced to 100 entries
  localStorage.setItem('app_logs', JSON.stringify(updatedLogs));
};

export const createPuterAPILogger = () => {
  const startTime = Date.now();
  
  return {
    logSuccess: (method: string, params: any, response: any) => {
      logPuterAPICall({
        method,
        model: params?.model,
        duration: Date.now() - startTime,
        timestamp: startTime,
        success: true,
      });
    },
    logError: (method: string, params: any, error: any) => {
      logPuterAPICall({
        method,
        model: params?.model,
        duration: Date.now() - startTime,
        timestamp: startTime,
        success: false,
      });
    },
  };
};

export const createOpenRouterAPILogger = () => {
  const startTime = Date.now();
  
  return {
    logSuccess: (model: string, params: any, response: any) => {
      logOpenRouterAPICall({
        method: 'chat.completions',
        model,
        duration: Date.now() - startTime,
        timestamp: startTime,
        success: true,
      });
    },
    logError: (model: string, params: any, error: any) => {
      logOpenRouterAPICall({
        method: 'chat.completions',
        model,
        duration: Date.now() - startTime,
        timestamp: startTime,
        success: false,
      });
    },
  };
};
