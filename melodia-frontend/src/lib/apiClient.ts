import { authApi } from './authApi';

type Primitive = string | number | boolean | null;
export type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };
type JsonRecord = { [key: string]: JsonValue };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3000';

function extractMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.error === 'string') return obj.error;
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

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(extractMessage(payload, `Request failed (${response.status})`));
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
