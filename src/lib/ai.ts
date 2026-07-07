import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

export const AI_MODEL = 'gemini-2.5-flash';

const API_KEY: string = import.meta.env.VITE_GEMINI_API_KEY || '';

let client: GoogleGenerativeAI | null = null;

export function isAIConfigured(): boolean {
  return !!API_KEY;
}

export function getAI(): GoogleGenerativeAI {
  if (!API_KEY) {
    throw new Error('AI is not configured. Add VITE_GEMINI_API_KEY to your .env file.');
  }
  if (!client) client = new GoogleGenerativeAI(API_KEY);
  return client;
}

interface GetModelOpts {
  json?: boolean;
  responseSchema?: object;
  systemInstruction?: string;
  model?: string;
}

export function getModel(opts: GetModelOpts = {}): GenerativeModel {
  const { json, responseSchema, systemInstruction, model = AI_MODEL } = opts;
  const generationConfig: Record<string, unknown> = {};
  if (json || responseSchema) generationConfig.responseMimeType = 'application/json';
  if (responseSchema) generationConfig.responseSchema = responseSchema;
  return getAI().getGenerativeModel({
    model,
    ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}

/**
 * Parse a model response that should be JSON: strips markdown fences and, if the
 * model wrapped the payload in prose, falls back to the outermost [] / {} span.
 */
export function parseAIJson<T>(text: string): T {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    for (const [open, close] of [['[', ']'], ['{', '}']] as const) {
      const start = cleaned.indexOf(open);
      const end = cleaned.lastIndexOf(close);
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1)) as T;
        } catch {
          // keep trying
        }
      }
    }
    throw new Error('AI returned an unreadable response — try again');
  }
}
