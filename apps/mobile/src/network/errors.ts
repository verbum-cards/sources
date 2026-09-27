// Три исхода сетевого запроса, которые различает request() — так вызывающий код
// (будущий sync-клиент, docs/sync-protocol.md) может решить, что делать: нет
// сети — отложить и повторить позже; таймаут — то же самое; сервер отверг —
// разбираться по содержимому ответа, а не ретраить вслепую.

// fetch упал (нет соединения, DNS, CORS и т.п.) — самого HTTP-обмена не было.
export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

// Запрос не уложился в отведённое время (AbortController).
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Сервер ответил, но не 2xx. body — распарсенное тело ответа (JSON, если это
// был JSON; иначе исходный текст; undefined, если тело пустое).
export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}
