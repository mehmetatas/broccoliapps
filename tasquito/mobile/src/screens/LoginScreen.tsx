import { Login, useAuth, useTheme, type AuthExchangeResponse } from "@broccoliapps/mobile";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function LoginScreen() {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  const onLoginSuccess = async (result: AuthExchangeResponse) => {
    await login({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Login
        title="Tasquito"
        slogan="Simple, fast task management"
        appId="tasquito"
        onLoginSuccess={onLoginSuccess}
      />
    </SafeAreaView>
  );
}
