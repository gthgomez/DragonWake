export const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function authHeaders(token: string | null): HeadersInit {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function api<T>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers ?? {}) },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error?.message ?? `HTTP ${res.status}`;
    const e = new Error(message) as Error & { code?: string };
    e.code = err?.error?.code;
    throw e;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
