import React, {useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../auth/AuthContext';
import {
  handleAppleSignIn,
  handleEmailSignIn,
  handleGoogleSignIn,
} from '../api/auth';
import {useTheme} from '../theme';
import type {StoredTokens} from '../auth/storage';

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export function LoginScreen() {
  const {login} = useAuth();
  const {colors, isDark} = useTheme();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<'google' | 'apple' | 'email' | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleLoginResult = async (result: AuthResult | null) => {
    if (!result) {
      console.log('[LoginScreen] handleLoginResult: result is null, auth returned without tokens');
      return;
    }
    const tokens: StoredTokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    };
    await login(tokens);
  };

  const onGooglePress = async () => {
    setError(null);
    setLoading('google');
    try {
      const result = await handleGoogleSignIn();
      await handleLoginResult(result);
    } catch (e) {
      console.error('[LoginScreen] Google sign-in error:', e);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const onApplePress = async () => {
    setError(null);
    setLoading('apple');
    try {
      const result = await handleAppleSignIn();
      await handleLoginResult(result);
    } catch (e) {
      console.error('[LoginScreen] Apple sign-in error:', e);
      setError('Apple sign-in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const onEmailPress = async () => {
    if (!email.trim()) {
      return;
    }
    setError(null);
    setLoading('email');
    try {
      const success = await handleEmailSignIn(email.trim());
      if (success) {
        setEmailSent(true);
      } else {
        setError('Failed to send email. Please try again.');
      }
    } catch (e) {
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.content}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            Check your email
          </Text>
          <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
            We sent a sign-in link to{'\n'}
            <Text style={[styles.emailHighlight, {color: colors.inputText}]}>
              {email}
            </Text>
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}>
            <Text style={[styles.backButtonText, {color: colors.accent}]}>
              Back to sign in
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            Tasquito
          </Text>
          <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
            Simple, fast task management
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
            {loading === 'google' ? (
              <ActivityIndicator color={colors.activityIndicator} />
            ) : (
              <Text
                style={[
                  styles.googleButtonText,
                  {color: colors.googleButtonText},
                ]}>
                Continue with Google
              </Text>
            )}
          </TouchableOpacity>

          {(Platform.OS === 'ios' || true) && (
            <TouchableOpacity
              style={[
                styles.appleButton,
                {backgroundColor: colors.appleButtonBg},
              ]}
              onPress={onApplePress}
              disabled={loading !== null}>
              {loading === 'apple' ? (
                <ActivityIndicator color={colors.appleButtonText} />
              ) : (
                <Text
                  style={[
                    styles.appleButtonText,
                    {color: colors.appleButtonText},
                  ]}>
                  Continue with Apple
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, {backgroundColor: colors.divider}]}
            />
            <Text style={[styles.dividerText, {color: colors.textTertiary}]}>
              or
            </Text>
            <View
              style={[styles.dividerLine, {backgroundColor: colors.divider}]}
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
              {backgroundColor: colors.accent},
              !email.trim() && {backgroundColor: colors.accentDisabled},
            ]}
            onPress={onEmailPress}
            disabled={loading !== null || !email.trim()}>
            {loading === 'email' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
        )}

        <Text style={[styles.terms, {color: colors.textTertiary}]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Nunito-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  emailHighlight: {
    fontFamily: 'Nunito-SemiBold',
  },
  authButtons: {
    gap: 12,
  },
  googleButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
  appleButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  emailInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  emailButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
  backButton: {
    marginTop: 24,
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  terms: {
    marginTop: 32,
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
});
