import { beautifyModelName, getProviderFromModelId, getCustomModels } from './model-utils';
import { ALL_OPENROUTER_MODELS } from './all-models';

// OpenRouter models (Venice + custom free models)
export const OPENROUTER_MODELS = [
  { id: 'openrouter:cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B Venice 🐬 (Uncensored)', provider: 'OpenRouter', isFree: true },
];

// Puter models (default)
export const PUTER_MODELS = [
  // Featured Models
  { id: 'openrouter:openai/gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'openrouter:anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'openrouter:google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'openrouter:deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'openrouter:xai/grok-3', name: 'Grok 3', provider: 'xAI' },
  { id: 'openrouter:meta/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta' },
  { id: 'openrouter:qwen/qwen3-max', name: 'Qwen 3 Max', provider: 'Qwen' },
  { id: 'openrouter:perplexity/sonar-pro', name: 'Sonar Pro', provider: 'Perplexity' },
  
  // Fast & Efficient
  { id: 'openrouter:openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI' },
  { id: 'openrouter:openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI' },
  { id: 'openrouter:google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'openrouter:anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
];

/**
 * Get all Puter models including ALL OpenRouter models (for Puter) and custom Puter models
 */
export function getAllPuterModels() {
  const customPuterModels = getCustomModels().filter(id => !id.startsWith('openrouter:'));
  const customModelObjects = customPuterModels.map(id => ({
    id,
    name: beautifyModelName(id),
    provider: getProviderFromModelId(id),
    isCustom: true,
  }));
  
  // Create model objects from ALL_OPENROUTER_MODELS (Puter uses these too)
  const allOpenRouterModelObjects = ALL_OPENROUTER_MODELS.map(id => ({
    id,
    name: beautifyModelName(id),
    provider: getProviderFromModelId(id),
  }));
  
  // Combine: Featured Puter models first, then all OpenRouter models, then custom
  const seenIds = new Set<string>();
  const allModels = [...PUTER_MODELS, ...allOpenRouterModelObjects, ...customModelObjects];
  
  return allModels.filter(model => {
    if (seenIds.has(model.id)) {
      return false;
    }
    seenIds.add(model.id);
    return true;
  });
}

/**
 * Get all OpenRouter models including custom OpenRouter models
 */
export function getAllOpenRouterModels() {
  const customOpenRouterModels = getCustomModels().filter(id => id.startsWith('openrouter:'));
  const customModelObjects = customOpenRouterModels.map(id => ({
    id,
    name: beautifyModelName(id),
    provider: getProviderFromModelId(id),
    isCustom: true,
  }));
  
  return [...OPENROUTER_MODELS, ...customModelObjects];
}

export const IMAGE_MODELS = [
  { id: 'flux', name: 'Flux', description: 'High quality, fast generation' },
  { id: 'kontext', name: 'Kontext', description: 'Contextual understanding' },
  { id: 'turbo', name: 'Turbo', description: 'Ultra fast generation' },
  { id: 'gptimage', name: 'GPT Image', description: 'GPT-powered generation' },
  { id: 'seedream', name: 'SeeDream', description: 'Artistic style' },
  { id: 'nanobanana', name: 'Nano Banana', description: 'Compact and efficient' },
];

// Import from separate file to keep this file clean
export { ALL_OPENROUTER_MODELS } from './all-models';
