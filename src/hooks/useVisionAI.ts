import { useState } from 'react';
import { createPuterAPILogger } from '@/lib/api-logger';

export const useVisionAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = async (
    imageUrl: string,
    prompt: string = 'Analyze this file and provide detailed insights about its content.',
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
      const chatPromise = (async () => {
        const res = await puter.ai.chat(prompt, imageUrl, { model });

        // Streaming response support
        const hasAsyncIter = (res as any)?.[Symbol.asyncIterator]?.bind(res);
        if (hasAsyncIter) {
          let full = '';
          for await (const part of res as any) {
            const text = part?.text ?? part?.delta ?? part?.message?.content ?? '';
            if (typeof text === 'string') full += text;
          }
          logger.logSuccess('puter.ai.chat (vision)', { prompt, imageUrl, model }, full);
          return full.trim();
        }

        // Non-streaming fallbacks
        if (typeof res === 'string') {
          logger.logSuccess('puter.ai.chat (vision)', { prompt, imageUrl, model }, res);
          return res;
        }
        if (Array.isArray(res)) {
          const result = res.map((p: any) => p?.text || '').join('');
          logger.logSuccess('puter.ai.chat (vision)', { prompt, imageUrl, model }, result);
          return result;
        }
        if (res && typeof res === 'object' && typeof (res as any).text === 'string') {
          logger.logSuccess('puter.ai.chat (vision)', { prompt, imageUrl, model }, (res as any).text);
          return (res as any).text;
        }

        logger.logSuccess('puter.ai.chat (vision)', { prompt, imageUrl, model }, '');
        return '';
      })();

      return await chatPromise;
    } catch (error) {
      logger.logError('puter.ai.chat (vision)', { prompt, imageUrl, model }, error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing };
};
