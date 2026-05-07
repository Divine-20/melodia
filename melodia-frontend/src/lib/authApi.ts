import type { Profile } from './database.types';

const ACCESS_TOKEN_KEY = 'melodia_access_token';
const REFRESH_TOKEN_KEY = 'melodia_refresh_token';
const API_PROFILE_KEY = 'melodia_api_profile';
const API_EMAIL_KEY = 'melodia_api_email';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3000';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

type AnyRecord = Record<string, unknown>;

function decodeJwtPayload(token: string): AnyRecord | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as AnyRecord;
  } catch {
    return null;
  }
}

function parseJwtExp(token: string): number | null {
  const decoded = decodeJwtPayload(token);
  return typeof decoded?.exp === 'number' ? decoded.exp : null;
}

function inferAdminFlag(source: AnyRecord | null | undefined): boolean {
  if (!source) return false;
  if (source.is_admin === true || source.isAdmin === true) return true;
  if (source.admin === true) return true;

  const role = source.role;
  if (typeof role === 'string' && role.toLowerCase() === 'admin') return true;

  const roles = source.roles;
  if (Array.isArray(roles)) {
    return roles.some((r) => String(r).toLowerCase() === 'admin');
  }
  if (typeof roles === 'string') {
    return roles
      .split(/[,\s]+/)
      .some((r) => r.trim().toLowerCase() === 'admin');
  }

  const perms = source.permissions ?? source.scopes;
  if (Array.isArray(perms)) {
    return perms.some((p) => String(p).toLowerCase().includes('admin'));
  }

  return false;
}

function mergeAdminFromJwt(profile: Profile, accessToken: string): Profile {
  const jwt = decodeJwtPayload(accessToken);
  if (!jwt) return profile;
  const fromToken = inferAdminFlag(jwt);
  if (!fromToken) return profile;
  return profile.is_admin ? profile : { ...profile, is_admin: true };
}

function mapUserToProfile(user: AnyRecord, accessToken?: string): Profile {
  const email = typeof user.email === 'string' ? user.email : '';
  const usernameFromEmail = email.includes('@') ? email.split('@')[0] : 'user';
  const now = new Date().toISOString();
  let profile: Profile = {
    id: String(user.id ?? user.userId ?? ''),
    username: String(user.username ?? usernameFromEmail),
    full_name: String(user.full_name ?? user.fullName ?? user.username ?? usernameFromEmail),
    is_admin: Boolean(user.is_admin ?? user.isAdmin) || inferAdminFlag(user),
    created_at: String(user.created_at ?? user.createdAt ?? now),
  };
  if (accessToken) profile = mergeAdminFromJwt(profile, accessToken);
  return profile;
}

/** Optional: comma-separated emails that get admin UI when the API omits `is_admin` (dev / demo). */
export function isListedAdminEmail(email: string | undefined): boolean {
  const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
  if (!raw?.trim() || !email) return false;
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return set.has(email.trim().toLowerCase());
}

async function request<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const maybeError = body as AnyRecord | null;
    const message =
      (maybeError && typeof maybeError.message === 'string' && maybeError.message) ||
      (maybeError && typeof maybeError.error === 'string' && maybeError.error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

function extractTokens(payload: AnyRecord): AuthTokens | null {
  const accessToken =
    typeof payload.accessToken === 'string'
      ? payload.accessToken
      : typeof payload.access_token === 'string'
        ? payload.access_token
        : null;
  const refreshToken =
    typeof payload.refreshToken === 'string'
      ? payload.refreshToken
      : typeof payload.refresh_token === 'string'
        ? payload.refresh_token
        : null;

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function extractUser(payload: AnyRecord): AnyRecord | null {
  const nestedKeys = ['user', 'data', 'profile', 'me'] as const;
  for (const key of nestedKeys) {
    const v = payload[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as AnyRecord;
  }
  if (typeof payload.id === 'string' || typeof payload.email === 'string') return payload;
  return null;
}

function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function saveProfile(profile: Profile) {
  localStorage.setItem(API_PROFILE_KEY, JSON.stringify(profile));
}

function saveEmail(email: string) {
  localStorage.setItem(API_EMAIL_KEY, email.trim().toLowerCase());
}

function readProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(API_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

function clearProfile() {
  localStorage.removeItem(API_PROFILE_KEY);
}

function readEmail(): string | null {
  return localStorage.getItem(API_EMAIL_KEY);
}

async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const payload = (await request<AnyRecord>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })) as AnyRecord;
  const tokens = extractTokens(payload);
  if (!tokens) throw new Error('Refresh endpoint did not return valid tokens');
  saveTokens(tokens);
  return tokens;
}

export const authApi = {
  getStoredTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  getStoredProfile(): Profile | null {
    return readProfile();
  },

  getStoredEmail(): string | null {
    return readEmail();
  },

  clearSession() {
    clearTokens();
    clearProfile();
    localStorage.removeItem(API_EMAIL_KEY);
  },

  async register(email: string, password: string): Promise<{ profile: Profile }> {
    const payload = (await request<AnyRecord>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })) as AnyRecord;

    const tokens = extractTokens(payload);
    const user = extractUser(payload);

    if (tokens) saveTokens(tokens);
    saveEmail(email);
    if (user) {
      const access = tokens?.accessToken;
      const profile = mapUserToProfile(user, access);
      saveProfile(profile);
      return { profile };
    }

    // Some APIs only create the user on register and return no user shape.
    return {
      profile: {
        id: '',
        username: email.split('@')[0] || 'user',
        full_name: email.split('@')[0] || 'user',
        is_admin: false,
        created_at: new Date().toISOString(),
      },
    };
  },

  async login(email: string, password: string): Promise<{ profile: Profile; tokens: AuthTokens }> {
    const payload = (await request<AnyRecord>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })) as AnyRecord;

    const tokens = extractTokens(payload);
    if (!tokens) throw new Error('Login failed: tokens are missing in response');
    saveTokens(tokens);
    saveEmail(email);

    const user = extractUser(payload);
    let profile: Profile;

    if (user) {
      profile = mapUserToProfile(user, tokens.accessToken);
    } else {
      const me = await this.me(tokens.accessToken);
      profile = me.profile;
    }

    saveProfile(profile);
    return { profile, tokens };
  },

  async me(accessToken: string): Promise<{ profile: Profile }> {
    const payload = (await request<AnyRecord>('/api/v1/auth/me', { method: 'GET' }, accessToken)) as AnyRecord;
    const user = extractUser(payload);
    if (!user) throw new Error('Unable to read user profile');
    const profile = mapUserToProfile(user, accessToken);
    saveProfile(profile);
    return { profile };
  },

  async getValidAccessToken(): Promise<string | null> {
    const tokens = this.getStoredTokens();
    if (!tokens) return null;

    const exp = parseJwtExp(tokens.accessToken);
    const nowSec = Math.floor(Date.now() / 1000);

    if (!exp || exp - nowSec > 30) {
      return tokens.accessToken;
    }

    try {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      return refreshed.accessToken;
    } catch {
      this.clearSession();
      return null;
    }
  },

  async refresh(): Promise<AuthTokens> {
    const tokens = this.getStoredTokens();
    if (!tokens) throw new Error('No refresh token found');
    return refreshAccessToken(tokens.refreshToken);
  },

  async logout() {
    const tokens = this.getStoredTokens();
    try {
      if (tokens) {
        await request<AnyRecord>(
          '/api/v1/auth/logout',
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          },
          tokens.accessToken
        );
      }
    } catch {
      // Logout should always clear local session, even if backend call fails.
    } finally {
      this.clearSession();
    }
  },
};
