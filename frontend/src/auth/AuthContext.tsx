import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/api/client";
import type { TokenPair, UserPublic } from "@/api/types";

type AuthState = {
  user: UserPublic | null;
  accessToken: string | null;
  refreshToken: string | null;
};

const STORAGE_KEY = "melodia_auth";

function loadStored(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  setFromTokens: (tokens: TokenPair, user?: UserPublic) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    typeof window !== "undefined" ? loadStored() : { user: null, accessToken: null, refreshToken: null },
  );

  const persist = useCallback((next: AuthState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    persist({ user: null, accessToken: null, refreshToken: null });
  }, [persist]);

  const setFromTokens = useCallback(
    async (tokens: TokenPair, user?: UserPublic) => {
      if (user) {
        persist({ user, accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
        return;
      }
      const me = await apiFetch<UserPublic>("/api/v1/auth/me", { token: tokens.access_token });
      persist({
        user: me,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
    },
    [persist],
  );

  const refreshSession = useCallback(async () => {
    if (!state.refreshToken) return;
    const tokens = await apiFetch<TokenPair>("/api/v1/auth/refresh", {
      method: "POST",
      body: { refresh_token: state.refreshToken },
    });
    await setFromTokens(tokens);
  }, [setFromTokens, state.refreshToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiFetch<TokenPair>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      });
      await setFromTokens(tokens);
    },
    [setFromTokens],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await apiFetch<UserPublic>("/api/v1/auth/register", {
        method: "POST",
        body: { email, password },
      });
      await login(email, password);
    },
    [login],
  );

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshSession,
      setFromTokens,
    }),
    [state, login, register, logout, refreshSession, setFromTokens],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
