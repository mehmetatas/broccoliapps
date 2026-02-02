import {
  authExchange,
  globalConfig,
  sendMagicLink,
  verifyApple,
  type AuthExchangeResponse,
} from "@broccoliapps/shared";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import InAppBrowser from "react-native-inappbrowser-reborn";
import { useLoginTheme } from "./theme";
import type { LoginProps } from "./types";

const parseCodeFromUrl = (url: string): string | null => {
  try {
    const urlWithoutFragment = url.split("#")[0] ?? "";
    const searchPart = urlWithoutFragment.split("?")[1];
    if (!searchPart) {
      return null;
    }
    return new URLSearchParams(searchPart).get("code");
  } catch {
    return null;
  }
};

export function Login({
  title,
  slogan,
  appId,
  onLoginSuccess,
  colors: colorOverrides,
}: LoginProps) {
  const { colors } = useLoginTheme(colorOverrides);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<"google" | "apple" | "email" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const appConfig = globalConfig.apps[appId];
  const baseUrl = appConfig.baseUrl;
  const broccoliappsBaseUrl = globalConfig.apps["broccoliapps-com"].baseUrl;
  const mobileScheme =
    "mobileScheme" in appConfig ? appConfig.mobileScheme : appId;

  const handleOAuthBrowser = async (
    provider: "google" | "apple",
  ): Promise<AuthExchangeResponse | null> => {
    const authUrl = `${broccoliappsBaseUrl}/auth?app=${appId}&provider=${provider}&platform=mobile`;
    const available = await InAppBrowser.isAvailable();
    if (!available) {
      return null;
    }

    const result = await InAppBrowser.openAuth(
      authUrl,
      `${mobileScheme}://auth/callback`,
      {
        ephemeralWebSession: false,
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
      },
    );

    if (result.type === "success" && result.url) {
      const code = parseCodeFromUrl(result.url);
      if (code) {
        return authExchange.invoke({ code }, { baseUrl, skipAuth: true });
      }
    }
    return null;
  };

  const onGooglePress = async () => {
    setError(null);
    setLoading("google");
    try {
      const result = await handleOAuthBrowser("google");
      if (result) {
        await onLoginSuccess(result);
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const onApplePress = async () => {
    setError(null);
    setLoading("apple");
    try {
      // Native Apple Sign In on iOS
      if (Platform.OS === "ios" && appleAuth.isSupported) {
        const appleAuthResponse = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        });

        const credentialState = await appleAuth.getCredentialStateForUser(
          appleAuthResponse.user,
        );

        if (credentialState !== appleAuth.State.AUTHORIZED) {
          return;
        }

        if (
          !appleAuthResponse.identityToken ||
          !appleAuthResponse.authorizationCode
        ) {
          return;
        }

        const result = await verifyApple.invoke(
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
          { baseUrl, skipAuth: true },
        );
        await onLoginSuccess(result);
        return;
      }

      // InAppBrowser fallback for Android
      const result = await handleOAuthBrowser("apple");
      if (result) {
        await onLoginSuccess(result);
      }
    } catch {
      setError("Apple sign-in failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const onEmailPress = async () => {
    if (!email.trim()) {
      return;
    }
    setError(null);
    setLoading("email");
    try {
      const result = await sendMagicLink.invoke(
        { email: email.trim(), platform: "mobile" },
        { baseUrl, skipAuth: true },
      );
      if (result.success) {
        setEmailSent(true);
      } else {
        setError("Failed to send email. Please try again.");
      }
    } catch {
      setError("Failed to send email. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Check your email
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a sign-in link to{"\n"}
            <Text style={[styles.emailHighlight, { color: colors.inputText }]}>
              {email}
            </Text>
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setEmailSent(false);
              setEmail("");
            }}>
            <Text style={[styles.backButtonText, { color: colors.accent }]}>
              Back to sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {slogan}
          </Text>
        </View>

        <View style={styles.authButtons}>
          <TouchableOpacity
            style={[
              styles.googleButton,
              {
                backgroundColor: colors.googleButtonBg,
                borderColor: colors.googleButtonBorder,
              },
            ]}
            onPress={onGooglePress}
            disabled={loading !== null}>
            {loading === "google" ?
              <ActivityIndicator color={colors.activityIndicator} />
              : (
                <Text
                  style={[
                    styles.googleButtonText,
                    { color: colors.googleButtonText },
                  ]}>
                Continue with Google
                </Text>
              )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.appleButton,
              { backgroundColor: colors.appleButtonBg },
            ]}
            onPress={onApplePress}
            disabled={loading !== null}>
            {loading === "apple" ?
              <ActivityIndicator color={colors.appleButtonText} />
              : (
                <Text
                  style={[
                    styles.appleButtonText,
                    { color: colors.appleButtonText },
                  ]}>
                Continue with Apple
                </Text>
              )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: colors.divider },
              ]}
            />
            <Text
              style={[styles.dividerText, { color: colors.textTertiary }]}>
              or
            </Text>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: colors.divider },
              ]}
            />
          </View>

          <TextInput
            style={[
              styles.emailInput,
              {
                color: colors.inputText,
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={colors.inputPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={loading === null}
          />

          <TouchableOpacity
            style={[
              styles.emailButton,
              { backgroundColor: colors.accent },
              !email.trim() && { backgroundColor: colors.accentDisabled },
            ]}
            onPress={onEmailPress}
            disabled={loading !== null || !email.trim()}>
            {loading === "email" ?
              <ActivityIndicator color="#fff" />
              : (
                <Text style={styles.emailButtonText}>
                Continue with Email
                </Text>
              )}
          </TouchableOpacity>
        </View>

        {error &&
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        }

        <Text style={[styles.terms, { color: colors.textTertiary }]}>
          By continuing, you agree to our{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(`${baseUrl}/terms`)}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(`${baseUrl}/privacy`)}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontFamily: "Nunito-Bold",
    marginBottom: 8,
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  emailHighlight: {
    fontFamily: "Nunito-SemiBold",
  },
  authButtons: {
    gap: 12,
  },
  googleButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
  appleButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  appleButtonText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  emailInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Nunito-Regular",
  },
  emailButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emailButtonText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    color: "#ffffff",
  },
  backButton: {
    marginTop: 24,
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    textAlign: "center",
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
  },
  terms: {
    marginTop: 32,
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    textDecorationLine: "underline",
  },
});
