import { authExchange, type CacheProvider, refreshToken as refreshTokenContract } from "@broccoliapps/shared";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";
import { clearClientCache, initializeMobileClient } from "./client";
import { type StoredTokens, type TokenStorage } from "./storage";

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

type AuthProviderProps = {
  apiBaseUrl: string;
  storage: TokenStorage;
  onInitClient?: (cache: CacheProvider) => void;
  children: React.ReactNode;
};

export const AuthProvider = ({ apiBaseUrl, storage, onInitClient, children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExchangingToken, setIsExchangingToken] = useState(false);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);

  const getAccessToken = useCallback(async (): Promise<string | undefined> => {
    const current = await storage.get();
    if (!current) {
      return undefined;
    }

    // Check if access token is still valid (with buffer)
    if (current.accessTokenExpiresAt > Date.now() + TOKEN_BUFFER_MS) {
      return current.accessToken;
    }

    // Try to refresh
    try {
      const result = await refreshTokenContract.invoke({ refreshToken: current.refreshToken }, { baseUrl: apiBaseUrl, skipAuth: true });

      const newTokens: StoredTokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
        refreshTokenExpiresAt: result.refreshTokenExpiresAt,
      };

      await storage.save(newTokens);
      setTokens(newTokens);
      return newTokens.accessToken;
    } catch {
      // Refresh failed — clear tokens
      await storage.clear();
      setTokens(null);
      return undefined;
    }
  }, [apiBaseUrl, storage]);

  // Initialize the shared API client with the token provider
  const onInitClientRef = useRef(onInitClient);
  onInitClientRef.current = onInitClient;

  useEffect(() => {
    initializeMobileClient(apiBaseUrl, getAccessToken, onInitClientRef.current);
  }, [apiBaseUrl, getAccessToken]);

  // Check for stored tokens on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stored = await storage.get();
        if (stored) {
          // Check if refresh token is still valid
          if (stored.refreshTokenExpiresAt > Date.now()) {
            setTokens(stored);
          } else {
            await storage.clear();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [storage]);

  const login = useCallback(
    async (newTokens: StoredTokens) => {
      await storage.save(newTokens);
      setTokens(newTokens);
    },
    [storage],
  );

  // Handle deep links for email sign-in callback
  useEffect(() => {
    // On cold start, fetch may fail if the network stack isn't ready yet.
    const delay = (ms: number) => new Promise<void>((r) => setTimeout(() => r(), ms));
    const invokeWithRetry = async (code: string, retries = 2) => {
      try {
        return await authExchange.invoke({ code }, { baseUrl: apiBaseUrl, skipAuth: true });
      } catch (e) {
        if (retries > 0) {
          await delay(500);
          return invokeWithRetry(code, retries - 1);
        }
        throw e;
      }
    };

    const handleDeepLink = async (url: string) => {
      if (!url.includes("auth/callback")) {
        return;
      }
      const searchPart = url.split("?")[1];
      if (!searchPart) {
        return;
      }
      const code = new URLSearchParams(searchPart).get("code");
      if (!code) {
        return;
      }

      setIsExchangingToken(true);
      try {
        const result = await invokeWithRetry(code);
        await login({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          accessTokenExpiresAt: result.accessTokenExpiresAt,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        });
      } catch (e) {
        console.error("[auth] deep link exchange error:", e);
      } finally {
        setIsExchangingToken(false);
      }
    };

    // Handle cold start (app not running when link tapped)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle warm start (app in background when link tapped)
    const sub = Linking.addEventListener("url", ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, [apiBaseUrl, login]);

  const logout = useCallback(async () => {
    clearClientCache();
    await storage.clear();
    setTokens(null);
  }, [storage]);

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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
