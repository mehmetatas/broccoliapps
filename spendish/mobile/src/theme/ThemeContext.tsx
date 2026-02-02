import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

const colors = {
  dark: {
    background: "#1C1C1E",
    surface: "#2C2C2E",
    surfaceBorder: "#3A3A3C",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    accent: "#FF6B6B",
    accentText: "#1C1C1E",
  },
  light: {
    background: "#F2F2F7",
    surface: "#FFFFFF",
    surfaceBorder: "#E5E5EA",
    text: "#000000",
    textSecondary: "#6C6C70",
    accent: "#FF6B6B",
    accentText: "#FFFFFF",
  },
};

export type Theme = typeof colors.dark;

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const value = useMemo(
    () => ({
      theme: isDark ? colors.dark : colors.light,
      isDark,
    }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
