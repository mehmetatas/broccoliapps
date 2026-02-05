import { AuthProvider as AuthProviderBase, createTokenStorage, type StoredTokens } from "@broccoliapps/mobile";
import type { AuthUserDto, JwtPayload } from "@broccoliapps/shared";
import { globalConfig, jwt } from "@broccoliapps/shared";
import { initClient, setUserFromAuth } from "@broccoliapps/tasquito-shared/client";
import React from "react";

type TokenPayload = JwtPayload & {
  data: {
    userId: string;
    email: string;
    name: string;
    provider: string;
  };
};

const getUserFromToken = (token: string): AuthUserDto | null => {
  try {
    const payload = jwt.decode<TokenPayload>(token);
    if (!payload?.data) {
      return null;
    }
    return {
      id: payload.data.userId,
      email: payload.data.email,
      name: payload.data.name,
      isNewUser: false,
    };
  } catch {
    return null;
  }
};

const baseStorage = createTokenStorage("com.broccoliapps.tasquito");

const storage = {
  ...baseStorage,
  get: async (): Promise<StoredTokens | null> => {
    const tokens = await baseStorage.get();
    if (tokens?.accessToken) {
      const user = getUserFromToken(tokens.accessToken);
      if (user) {
        setUserFromAuth(user);
      }
    }
    return tokens;
  },
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProviderBase apiBaseUrl={globalConfig.apps.tasquito.baseUrl} storage={storage} onInitClient={(cache) => initClient(cache)}>
      {children}
    </AuthProviderBase>
  );
};
