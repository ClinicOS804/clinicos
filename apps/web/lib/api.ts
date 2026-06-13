const API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    : '';   // In browser, use relative /api/* which is proxied via next.config.js or .htaccess

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed', code: 'UNKNOWN' }));
    throw { ...(err as object), statusCode: res.status };
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body }),
  patch:  <T>(path: string, body: unknown)   => request<T>(path, { method: 'PATCH',  body }),
  put:    <T>(path: string, body: unknown)   => request<T>(path, { method: 'PUT',    body }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
};
