/**
 * Admin auth — token-based (OIDC будет позже, этап 2).
 *
 * Токен живёт в sessionStorage (не localStorage — чтобы по закрытию вкладки
 * админ переавторизовался).
 */
const KEY = "eios_admin_token";

let _token: string | null = sessionStorage.getItem(KEY);

export function getToken(): string | null { return _token; }

export function setToken(t: string): void {
  _token = t;
  sessionStorage.setItem(KEY, t);
}

export function clearToken(): void {
  _token = null;
  sessionStorage.removeItem(KEY);
}

/**
 * fetch-обёртка с авто-добавлением Authorization. Возвращает Response.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (_token) headers.set("Authorization", `Bearer ${_token}`);
  return fetch(`/api${path}`, { ...init, headers });
}
