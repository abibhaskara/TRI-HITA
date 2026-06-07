import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * geminiUtils.js
 * Shared utilities for Gemini API integration.
 * Centralizes error parsing to avoid duplicate logic across pages.
 */

/**
 * Parse a Gemini API error into a user-facing localized string.
 * @param {Error} err
 * @param {Function} t - translation function from useLang()
 * @returns {string}
 */
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

/**
 * Executes a Gemini API call, falling back to the next available API key if the current one is exhausted or invalid.
 * Reads keys from VITE_GEMINI_API_KEYS (comma separated) or VITE_GEMINI_API_KEY.
 * 
 * @param {Object} modelConfig - Config object for getGenerativeModel (e.g., { model: 'gemini-2.5-flash' })
 * @param {Function} executeFn - Async function that takes a (model) and returns the API result.
 */
export async function executeWithGeminiFallback(modelConfig, executeFn) {
  const keysStr = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || '';
  const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);

  if (keys.length === 0) {
    throw new Error('API key missing. Check VITE_GEMINI_API_KEYS in .env');
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
      
      // If error is quota exceeded, rate limited, or invalid API key, fallback to next key
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
      
      // Other errors (e.g., safety blocked, bad request) should be thrown immediately
      throw err;
    }
  }

  // If we exhaust all keys, throw the last error encountered
  throw lastErr;
}
