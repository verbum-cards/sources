// Точка для будущего входа (не реализован): request() зовёт этот провайдер перед
// каждым запросом и, если он вернул токен, добавляет Authorization: Bearer.
// Само хранение токена (expo-secure-store) — задача будущего экрана входа, не сюда.
export type AuthTokenProvider = () => Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider;
}

export async function getAuthToken(): Promise<string | null> {
  if (!authTokenProvider) return null;
  return authTokenProvider();
}
