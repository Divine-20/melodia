import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { localStore } from '../lib/localStore';
import { authApi, isListedAdminEmail } from '../lib/authApi';
import type { Profile } from '../lib/database.types';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLocalProfile = useCallback((userId: string) => {
    const p = localStore.getProfile(userId);
    setProfile(p ?? null);
  }, []);

  const setAuthenticated = useCallback((nextProfile: Profile, email: string) => {
    const userId = nextProfile.id || email.trim().toLowerCase();
    const u: AuthUser = { id: userId, email: email.trim().toLowerCase() };
    setUser(u);
    setSession({ user: u });
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const token = await authApi.getValidAccessToken();
      const cachedProfile = authApi.getStoredProfile();

      if (!token) {
        // Fallback to local demo auth data if API tokens are unavailable.
        const userId = localStore.getSessionUserId();
        if (userId) {
          const email = localStore.getUserEmail(userId);
          if (email) {
            const u: AuthUser = { id: userId, email };
            setUser(u);
            setSession({ user: u });
            loadLocalProfile(userId);
          } else {
            localStore.setSessionUserId(null);
          }
        }
        setLoading(false);
        return;
      }

      try {
        const { profile: meProfile } = await authApi.me(token);
        const email = authApi.getStoredEmail() ?? `${meProfile.username}@melodia.app`;
        setAuthenticated(meProfile, email);
      } catch {
        if (cachedProfile) {
          const fallbackEmail = authApi.getStoredEmail() ?? `${cachedProfile.username}@melodia.app`;
          setAuthenticated(cachedProfile, fallbackEmail);
        } else {
          authApi.clearSession();
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      }

      setLoading(false);
    }

    bootstrap();
  }, [loadLocalProfile, setAuthenticated]);

  async function signUp(email: string, password: string) {
    try {
      await authApi.register(email, password);
      const { profile } = await authApi.login(email, password);
      setAuthenticated(profile, email);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { profile } = await authApi.login(email, password);
      setAuthenticated(profile, email);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    localStore.setSessionUserId(null);
    await authApi.logout();
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signUp, signIn, signOut,
      isAdmin: Boolean(profile?.is_admin) || isListedAdminEmail(user?.email),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
