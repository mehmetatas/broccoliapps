import type { ReactNode } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";

type GradientBackgroundProps = {
  children: ReactNode;
};

export const GradientBackground = ({ children }: GradientBackgroundProps) => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F0E8E0" />
            <Stop offset="0.25" stopColor="#D8E8F0" />
            <Stop offset="0.5" stopColor="#A0C8D8" />
            <Stop offset="1" stopColor="#6098B0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
      </Svg>
      <SafeAreaView style={styles.safe} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
