import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/endpoints';
import { setAuthToken, setOnUnauthorized } from '../api/client';
import type { Role, User } from '../api/types';

const TOKEN_KEY = 'niwala.token';
const USER_KEY = 'niwala.user';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads the user, e.g. to pick up a block applied while signed in. */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const persist = useCallback(async (nextUser: User, token: string) => {
    setAuthToken(token);
    setUser(nextUser);
    setStatus('signedIn');
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(nextUser)],
    ]);
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setStatus('signedOut');
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  // Restore a previous session before showing anything, so the app does not
  // flash the login screen at someone who is already signed in.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [[, token], [, storedUser]] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          USER_KEY,
        ]);

        if (!token || !storedUser) {
          if (!cancelled) setStatus('signedOut');
          return;
        }

        setAuthToken(token);
        // Show the stored user immediately, then confirm with the server.
        if (!cancelled) {
          setUser(JSON.parse(storedUser) as User);
          setStatus('signedIn');
        }

        const { user: fresh } = await authApi.me();
        if (!cancelled) {
          setUser(fresh);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
        }
      } catch {
        // Expired or rejected token, or the API is unreachable with a token we
        // cannot verify — start signed out rather than half-authenticated.
        if (!cancelled) {
          setAuthToken(null);
          setUser(null);
          setStatus('signedOut');
          await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from the API means this session is over.
  useEffect(() => {
    setOnUnauthorized(() => {
      void signOut();
    });
    return () => setOnUnauthorized(null);
  }, [signOut]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { user: nextUser, token } = await authApi.login(email, password);
      await persist(nextUser, token);
    },
    [persist]
  );

  const signUp = useCallback(
    async (email: string, password: string, role: Role) => {
      const { user: nextUser, token } = await authApi.register(email, password, role);
      await persist(nextUser, token);
    },
    [persist]
  );

  const refreshUser = useCallback(async () => {
    const { user: fresh } = await authApi.me();
    setUser(fresh);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut, refreshUser }),
    [status, user, signIn, signUp, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
