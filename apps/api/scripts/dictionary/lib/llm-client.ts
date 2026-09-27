// Тонкая обёртка над OpenAI Chat Completions через fetch — без зависимости
// на пакет openai (в проекте и так почти нет зависимостей на apps/api, а нужен
// один эндпоинт с JSON-ответом). Ключ — только из окружения (OPENAI_API_KEY).
export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ChatResult {
  content: string;
  usage: ChatUsage;
}

export type ChatFn = (params: { model: string; messages: ChatMessage[]; temperature?: number }) => Promise<ChatResult>;

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      'OPENAI_API_KEY не задан. Добавьте ключ в .env (см. .env.example) или в переменные окружения — ' +
        'без него конвейер не может вызывать LLM.',
    );
    this.name = 'MissingApiKeyError';
  }
}

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new MissingApiKeyError();
  return key;
}

export const callOpenAiChat: ChatFn = async ({ model, messages, temperature = 0.3 }) => {
  const apiKey = getApiKey();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API вернул ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenAI API вернул ответ без content');
  }
  return {
    content,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    },
  };
};
