import { getAuthToken } from './auth-token';
import { HttpError, NetworkError, TimeoutError } from './errors';

const DEFAULT_TIMEOUT_MS = 15000;

// Минимальные структурные типы вместо DOM-овских Response/RequestInit: реальный
// fetch им и так соответствует, а тестовый мок не обязан тянуть DOM lib —
// tests/tsconfig.json собран без него (см. apps/mobile/tests/tsconfig.json).
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export interface FetchRequestInitLike {
  method: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export type FetchLike = (url: string, init: FetchRequestInitLike) => Promise<FetchResponseLike>;

export interface RequestOptions {
  method?: string;
  body?: unknown; // JSON-сериализуемое тело
  headers?: Record<string, string>;
  timeoutMs?: number;
  // Инжектируемый fetch — по умолчанию глобальный. Тесты подставляют мок, чтобы
  // не делать реальных сетевых вызовов.
  fetchImpl?: FetchLike;
}

function getBaseUrl(): string {
  // EXPO_PUBLIC_* — стандартный способ публичных env-переменных в Expo (инлайнятся
  // в бандл на этапе сборки). Ошибка бросается здесь, при первом реальном вызове,
  // а не молча подставляется фейковый адрес.
  const baseUrl = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (!baseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL не задан. Добавьте его в .env (см. .env.example) перед первым сетевым запросом.'
    );
  }

  return baseUrl;
}

function buildUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${trimmedBase}${normalizedPath}`;
}

async function parseBody(response: FetchResponseLike): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    const parsed: unknown = JSON.parse(text);

    return parsed;
  } catch {
    return text;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

// Собирает URL из EXPO_PUBLIC_API_URL, ставит JSON-заголовки и Authorization
// (если задан провайдер токена, см. auth-token.ts), парсит ответ и различает три
// исхода: NetworkError (fetch упал), TimeoutError (не уложились в timeoutMs),
// HttpError (сервер ответил не 2xx) — см. errors.ts.
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
  } = options;

  const baseUrl = getBaseUrl();
  const url = buildUrl(baseUrl, path);

  const token = await getAuthToken();
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: FetchResponseLike;
  try {
    response = await fetchImpl(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (isAbortError(err)) {
      throw new TimeoutError(`Запрос ${method} ${path} превысил ${timeoutMs} мс`);
    }
    throw new NetworkError(`Не удалось выполнить запрос ${method} ${path}`, { cause: err });
  } finally {
    clearTimeout(timeoutId);
  }

  const parsedBody = await parseBody(response);

  if (!response.ok) {
    throw new HttpError(
      response.status,
      parsedBody,
      `HTTP ${response.status} для ${method} ${path}`
    );
  }

  return parsedBody as T;
}
