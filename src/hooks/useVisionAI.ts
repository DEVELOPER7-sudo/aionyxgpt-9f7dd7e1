import { useState } from 'react';
import { createPuterAPILogger } from '@/lib/api-logger';

export const useVisionAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = async (
    imageUrl: string,
    prompt: string = 'What do you see?',
    model: string = 'gpt-5-nano'
  ): Promise<string> => {
    // @ts-ignore - Puter is loaded via script tag
    const puter = (window as any)?.puter;
    if (!puter?.ai?.chat) {
      console.warn('Puter AI not available');
      return '';
    }

    setIsAnalyzing(true);
    const logger = createPuterAPILogger();
    
    try {
      const result = await puter.ai.chat(prompt, imageUrl, { model });
      logger.logSuccess('puter.ai.chat (vision)', { prompt, imageUrl, model }, result);
      return typeof result === 'string' ? result : String(result);
    } catch (error) {
      logger.logError('puter.ai.chat (vision)', { prompt, imageUrl, model }, error);
      console.error('Vision AI error:', error);
      return '';
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing };
};
