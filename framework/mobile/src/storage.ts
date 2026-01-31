import * as Keychain from 'react-native-keychain';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export type TokenStorage = {
  save: (tokens: StoredTokens) => Promise<void>;
  get: () => Promise<StoredTokens | null>;
  clear: () => Promise<void>;
};

export const createTokenStorage = (service: string): TokenStorage => ({
  save: async (tokens: StoredTokens) => {
    await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), {
      service,
    });
  },
  get: async () => {
    const result = await Keychain.getGenericPassword({service});
    if (!result) {
      return null;
    }
    return JSON.parse(result.password) as StoredTokens;
  },
  clear: async () => {
    await Keychain.resetGenericPassword({service});
  },
});
