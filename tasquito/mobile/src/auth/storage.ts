import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.broccoliapps.tasquito';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export const saveTokens = async (tokens: StoredTokens): Promise<void> => {
  await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), {
    service: SERVICE,
  });
};

export const getTokens = async (): Promise<StoredTokens | null> => {
  const result = await Keychain.getGenericPassword({service: SERVICE});
  if (!result) {
    return null;
  }
  return JSON.parse(result.password) as StoredTokens;
};

export const clearTokens = async (): Promise<void> => {
  await Keychain.resetGenericPassword({service: SERVICE});
};
