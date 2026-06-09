import { GoogleGenerativeAI } from '@google/generative-ai';

export function parseGeminiError(err, t) {
  const msg = err?.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('QUOTA')) {
    return t('quota_exceeded', 'Quota exceeded. Try again later.');
  }
  if (msg.includes('403') || msg.includes('API key') || msg.includes('API_KEY_INVALID') || msg.includes('leaked')) {
    return t('api_key_invalid', 'Invalid API key.');
  }
  if (msg.includes('500') || msg.includes('503')) {
    return t('analysis_failed', 'Service unavailable. Try again later.');
  }
  return `${t('analysis_failed', 'Analysis failed.')} ${msg}`;
}

export async function executeWithGeminiFallback(modelConfig, executeFn) {
  const keysStr = import.meta.env.VITE_GEMINI_API_KEY || '';
  const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);

  if (keys.length === 0) {
    throw new Error('API key missing. Check VITE_GEMINI_API_KEY in .env');
  }

  let lastErr;
  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel(modelConfig);
      return await executeFn(model);
    } catch (err) {
      lastErr = err;
      const msg = err?.message || '';
      if (
        msg.includes('429') || 
        msg.includes('quota') || 
        msg.includes('QUOTA') || 
        msg.includes('API_KEY_INVALID') ||
        msg.includes('API key not valid')
      ) {
        console.warn(`[TRI-HITA AI] Gemini API key index ${i} exhausted/failed. Trying next key if available...`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr;
}
