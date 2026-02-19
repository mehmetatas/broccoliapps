import { type AuthExchangeResponse, Login, useAuth, useTheme } from "@broccoliapps/mobile";
import * as client from "@broccoliapps/tasquito-shared";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const LoginScreen = () => {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  const onLoginSuccess = async (result: AuthExchangeResponse) => {
    client.setUserFromAuth(result.user);
    await login({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Login
        title="Tasquito"
        slogan="Simple, fast task management"
        appId="tasquito"
        onLoginSuccess={onLoginSuccess}
        brandingIcon={require("../../assets/broccoli-logo.png")}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
