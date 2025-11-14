import { z } from 'zod';

// Message validation schema
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
});

export const messagesSchema = z.array(messageSchema).min(1).max(100);

// OpenRouter chat request schema
export const openRouterRequestSchema = z.object({
  messages: messagesSchema,
  model: z.string().min(1).max(255),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  max_tokens: z.number().min(1).max(100000).optional().default(2000),
});

export type OpenRouterRequest = z.infer<typeof openRouterRequestSchema>;

// Settings validation
export const settingsSchema = z.object({
  textModel: z.string().min(1),
  imageModel: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(100000),
  enableWebSearch: z.boolean().default(false),
  enableDeepSearch: z.boolean().default(false),
  enableDebugLogs: z.boolean().optional().default(false),
  themeColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  sidebarColor: z.string().optional(),
  taskMode: z.enum(['standard', 'reasoning', 'research', 'creative']).optional().default('standard'),
  provider: z.enum(['puter', 'openrouter']).optional(),
  customOpenRouterKey: z.string().optional(),
  streamingEnabled: z.boolean().optional().default(true),
  incognitoMode: z.boolean().optional().default(false),
});

export type AppSettings = z.infer<typeof settingsSchema>;

// Trigger schema
export const triggerSchema = z.object({
  tag: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  category: z.string().min(1),
  instruction: z.string().min(1),
  metadata: z.object({
    purpose: z.string(),
    context_used: z.string(),
    influence_scope: z.string(),
  }),
});

export type DetectedTrigger = z.infer<typeof triggerSchema>;

// Validate message content
export const validateMessage = (message: unknown) => {
  try {
    return messageSchema.parse(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid message: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

// Validate messages array
export const validateMessages = (messages: unknown) => {
  try {
    return messagesSchema.parse(messages);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid messages: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

// Validate OpenRouter request
export const validateOpenRouterRequest = (request: unknown) => {
  try {
    return openRouterRequestSchema.parse(request);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid request: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
};

// Validate settings
export const validateSettings = (settings: unknown) => {
  try {
    return settingsSchema.parse(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid settings: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};
