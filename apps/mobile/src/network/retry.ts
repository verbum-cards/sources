import { NetworkError, TimeoutError } from './errors';

export interface WithRetryOptions {
  // Общее число попыток, включая первую (по умолчанию 3).
  maxAttempts?: number;
  // Задержка перед второй попыткой; растёт экспоненциально (по умолчанию 500мс).
  baseDelayMs?: number;
  // Инжектируемая задержка — тесты подставляют мгновенную, чтобы не ждать реально.
  delay?: (ms: number) => Promise<void>;
}

function isRetryable(error: unknown): boolean {
  return error instanceof NetworkError || error instanceof TimeoutError;
}

const realDelay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Универсальная утилита ретраев с экспоненциальным backoff — не завязана на
// конкретную политику синхронизации (у sync своя частота, «не чаще раза в
// минуту», см. docs/sync-protocol.md — это в будущем sync-модуле, не здесь).
// Повторяет только на NetworkError/TimeoutError: ошибку сервера (HttpError)
// вслепую ретраить нельзя — её должен разобрать вызывающий код.
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500, delay = realDelay } = options;

  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt >= maxAttempts) {
        throw error;
      }
      const backoffMs = baseDelayMs * 2 ** (attempt - 1);
      await delay(backoffMs);
    }
  }
}
