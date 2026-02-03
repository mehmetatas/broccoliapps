import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "./AuthContext";
import type { AppColors } from "./types";

type AuthGateColors = Pick<AppColors, "background" | "accent" | "textMuted">;

type AuthGateProps = {
  colors: AuthGateColors;
  loginScreen: React.ReactNode;
  children: React.ReactNode;
};

export function AuthGate({ colors, loginScreen, children }: AuthGateProps) {
  const { isLoading, isAuthenticated, isExchangingToken } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated && isExchangingToken) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.signingInText, { color: colors.textMuted }]}>Signing in...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <>{loginScreen}</>;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  signingInText: {
    marginTop: 16,
    fontSize: 16,
  },
});
