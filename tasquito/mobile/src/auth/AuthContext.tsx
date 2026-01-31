import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Linking} from 'react-native';
import {
  refreshToken as refreshTokenContract,
  authExchange,
} from '@broccoliapps/tasquito-shared';
import {config} from '../config';
import {initializeApiClient} from '../api/client';
import {
  clearTokens,
  getTokens,
  saveTokens,
  type StoredTokens,
} from './storage';

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  isExchangingToken: boolean;
  login: (tokens: StoredTokens) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | undefined>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token buffer: refresh 5 minutes before expiry
const TOKEN_BUFFER_MS = 5 * 60 * 1000;

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExchangingToken, setIsExchangingToken] = useState(false);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);

  const getAccessToken = useCallback(async (): Promise<string | undefined> => {
    const current = await getTokens();
    if (!current) {
      return undefined;
    }

    // Check if access token is still valid (with buffer)
    if (current.accessTokenExpiresAt > Date.now() + TOKEN_BUFFER_MS) {
      return current.accessToken;
    }

    // Try to refresh
    try {
      const result = await refreshTokenContract.invoke(
        {refreshToken: current.refreshToken},
        {baseUrl: config.apiBaseUrl, skipAuth: true},
      );

      const newTokens: StoredTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
        refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      };

      await saveTokens(newTokens);
      setTokens(newTokens);
      return newTokens.accessToken;
    } catch {
      // Refresh failed — clear tokens
      await clearTokens();
      setTokens(null);
      return undefined;
    }
  }, []);

  // Initialize the shared API client with the token provider
  useEffect(() => {
    initializeApiClient(getAccessToken);
  }, [getAccessToken]);

  // Check for stored tokens on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stored = await getTokens();
        if (stored) {
          // Check if refresh token is still valid
          if (stored.refreshTokenExpiresAt > Date.now()) {
            setTokens(stored);
          } else {
            await clearTokens();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (newTokens: StoredTokens) => {
    await saveTokens(newTokens);
    setTokens(newTokens);
  }, []);

  // Handle deep links for email sign-in callback
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url.includes('auth/callback')) return;
      const searchPart = url.split('?')[1];
      if (!searchPart) return;
      const code = new URLSearchParams(searchPart).get('code');
      if (!code) return;

      setIsExchangingToken(true);
      try {
        const result = await authExchange.invoke(
          {code},
          {baseUrl: config.apiBaseUrl, skipAuth: true},
        );
        await login({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        });
      } catch (e) {
        console.error('[auth] deep link exchange error:', e);
      } finally {
        setIsExchangingToken(false);
      }
    };

    // Handle cold start (app not running when link tapped)
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    // Handle warm start (app in background when link tapped)
    const sub = Linking.addEventListener('url', ({url}) =>
      handleDeepLink(url),
    );
    return () => sub.remove();
  }, [login]);

  const logout = useCallback(async () => {
    await clearTokens();
    setTokens(null);
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated: tokens !== null,
      isExchangingToken,
      login,
      logout,
      getAccessToken,
    }),
    [isLoading, isExchangingToken, tokens, login, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
