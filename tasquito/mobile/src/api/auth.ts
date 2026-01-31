import {Platform} from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {
  authExchange,
  sendMagicLink,
  verifyApple,
  type AuthExchangeResponse,
  type VerifyAppleResponse,
} from '@broccoliapps/tasquito-shared';
import {config} from '../config';

const parseCodeFromUrl = (url: string): string | null => {
  try {
    // Handle deep link URLs like tasquito://auth/callback?code=XXX
    // Strip fragment (e.g. trailing #) before parsing — OAuth redirects may include one
    const urlWithoutFragment = url.split('#')[0];
    const searchPart = urlWithoutFragment.split('?')[1];
    if (!searchPart) {
      console.log('[auth] parseCodeFromUrl: no query string in url:', url);
      return null;
    }
    const params = new URLSearchParams(searchPart);
    const code = params.get('code');
    console.log('[auth] parseCodeFromUrl: code =', code ? `${code.slice(0, 8)}...` : null);
    return code;
  } catch (e) {
    console.error('[auth] parseCodeFromUrl: error parsing url:', url, e);
    return null;
  }
};

export const handleGoogleSignIn =
  async (): Promise<AuthExchangeResponse | null> => {
    const authUrl = `${config.broccoliappsBaseUrl}/auth?app=tasquito&provider=google&platform=mobile`;
    console.log('[auth:google] opening auth URL:', authUrl);

    const browserAvailable = await InAppBrowser.isAvailable();
    console.log('[auth:google] InAppBrowser available:', browserAvailable);

    if (browserAvailable) {
      const result = await InAppBrowser.openAuth(authUrl, `${config.urlScheme}://auth/callback`, {
        ephemeralWebSession: false,
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      });
      console.log('[auth:google] InAppBrowser result:', {type: result.type, url: 'url' in result ? result.url : undefined});

      if (result.type === 'success' && result.url) {
        const code = parseCodeFromUrl(result.url);
        if (code) {
          try {
            const response = await authExchange.invoke(
              {code},
              {baseUrl: config.apiBaseUrl, skipAuth: true},
            );
            console.log('[auth:google] authExchange response:', JSON.stringify(response));
            return response;
          } catch (e) {
            console.error('[auth:google] authExchange error:', e);
            throw e;
          }
        }
        console.log('[auth:google] no code parsed from callback URL');
      } else {
        console.log('[auth:google] browser result was not success or had no url');
      }
    }

    console.log('[auth:google] returning null');
    return null;
  };

export const handleAppleSignIn =
  async (): Promise<AuthExchangeResponse | VerifyAppleResponse | null> => {
    // Native Apple Sign In on iOS
    console.log('[auth:apple] Platform:', Platform.OS, 'appleAuth.isSupported:', Platform.OS === 'ios' ? appleAuth.isSupported : 'N/A');

    if (Platform.OS === 'ios' && appleAuth.isSupported) {
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });
      console.log('[auth:apple] appleAuthResponse:', {
        user: appleAuthResponse.user,
        hasIdentityToken: !!appleAuthResponse.identityToken,
        hasAuthorizationCode: !!appleAuthResponse.authorizationCode,
        fullName: appleAuthResponse.fullName,
      });

      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthResponse.user,
      );
      console.log('[auth:apple] credentialState:', credentialState, '(AUTHORIZED =', appleAuth.State.AUTHORIZED, ')');

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        console.log('[auth:apple] returning null: not authorized');
        return null;
      }

      if (!appleAuthResponse.identityToken || !appleAuthResponse.authorizationCode) {
        console.log('[auth:apple] returning null: missing tokens', {
          identityToken: !!appleAuthResponse.identityToken,
          authorizationCode: !!appleAuthResponse.authorizationCode,
        });
        return null;
      }

      try {
        const response = await verifyApple.invoke(
          {
            identityToken: appleAuthResponse.identityToken,
            authorizationCode: appleAuthResponse.authorizationCode,
            user: appleAuthResponse.user,
            fullName: appleAuthResponse.fullName
              ? {
                  givenName: appleAuthResponse.fullName.givenName,
                  familyName: appleAuthResponse.fullName.familyName,
                }
              : undefined,
          },
          {baseUrl: config.apiBaseUrl, skipAuth: true},
        );
        console.log('[auth:apple] verifyApple response:', JSON.stringify(response));
        return response;
      } catch (e) {
        console.error('[auth:apple] verifyApple error:', e);
        throw e;
      }
    }

    // InAppBrowser fallback for Android
    const authUrl = `${config.broccoliappsBaseUrl}/auth?app=tasquito&provider=apple&platform=mobile`;
    console.log('[auth:apple:android] opening auth URL:', authUrl);

    const browserAvailable = await InAppBrowser.isAvailable();
    console.log('[auth:apple:android] InAppBrowser available:', browserAvailable);

    if (browserAvailable) {
      const result = await InAppBrowser.openAuth(authUrl, `${config.urlScheme}://auth/callback`, {
        ephemeralWebSession: false,
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      });
      console.log('[auth:apple:android] InAppBrowser result:', {type: result.type, url: 'url' in result ? result.url : undefined});

      if (result.type === 'success' && result.url) {
        const code = parseCodeFromUrl(result.url);
        if (code) {
          try {
            const response = await authExchange.invoke(
              {code},
              {baseUrl: config.apiBaseUrl, skipAuth: true},
            );
            console.log('[auth:apple:android] authExchange response:', JSON.stringify(response));
            return response;
          } catch (e) {
            console.error('[auth:apple:android] authExchange error:', e);
            throw e;
          }
        }
        console.log('[auth:apple:android] no code parsed from callback URL');
      } else {
        console.log('[auth:apple:android] browser result was not success or had no url');
      }
    }

    console.log('[auth:apple] returning null');
    return null;
  };

export const handleEmailSignIn = async (
  email: string,
): Promise<boolean> => {
  const result = await sendMagicLink.invoke(
    {email, platform: 'mobile'},
    {baseUrl: config.apiBaseUrl, skipAuth: true},
  );
  return result.success;
};
