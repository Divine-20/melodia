import { authApi } from './authApi';

type Primitive = string | number | boolean | null;
export type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = { [key: string]: JsonValue };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3000';

function extractMessage(payload: unknown, fallback: string): string {
  if (payload == null || payload === '') return fallback;
  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  if (typeof payload !== 'object') return fallback;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
  if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
  // FastAPI: { "detail": "..." } or { "detail": [{ "msg": "...", "loc": [...] }] }
  const detail = obj.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const parts: string[] = [];
    for (const item of detail) {
      if (typeof item === 'string' && item.trim()) parts.push(item.trim());
      else if (item && typeof item === 'object' && 'msg' in item) {
        const m = (item as { msg?: unknown }).msg;
        if (typeof m === 'string' && m.trim()) parts.push(m.trim());
      }
    }
    if (parts.length) return parts.join('. ');
  }
  return fallback;
}

async function parseResponse(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  init?: RequestInit & { requireAuth?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (init?.requireAuth) {
    const token = await authApi.getValidAccessToken();
    if (!token) throw new Error('Please sign in to continue');
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    const token = await authApi.getValidAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        'Cannot reach the server. Check your network connection and that the Melodia API is running.'
      );
    }
    throw e;
  }
  const payload = await parseResponse(response);

  if (!response.ok) {
    const statusHint =
      response.statusText.trim() || `HTTP ${response.status}`;
    throw new Error(extractMessage(payload, `${statusHint} (${response.status})`));
  }

  return payload as T;
}

export function asArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const objectPayload = payload as Record<string, unknown>;
    const list = objectPayload.data ?? objectPayload.items ?? objectPayload.results;
    if (Array.isArray(list)) return list as T[];
  }
  return [];
}

export function asObject(payload: unknown): JsonRecord {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as JsonRecord;
  }
  return {};
}
