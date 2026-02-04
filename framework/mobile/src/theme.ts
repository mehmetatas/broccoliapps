import { useColorScheme } from "react-native";
import type { AppColors, LoginColors } from "./types";

const lightColors: AppColors = {
  background: "#ffffff",
  backgroundSecondary: "#f5f5f5",
  textPrimary: "#000000",
  textSecondary: "#666666",
  textTertiary: "#999999",
  textMuted: "#6b7280",
  border: "#dadce0",
  divider: "#e0e0e0",
  inputText: "#333333",
  inputPlaceholder: "#999999",
  inputBackground: "#ffffff",
  accent: "#10b981",
  accentDisabled: "#a7f3d0",
  googleButtonBg: "#ffffff",
  googleButtonText: "#333333",
  googleButtonBorder: "#dadce0",
  appleButtonBg: "#000000",
  appleButtonText: "#ffffff",
  buttonSecondaryBg: "#9E9E9E",
  error: "#ef4444",
  danger: "#D32F2F",
  activityIndicator: "#333333",
};

const darkColors: AppColors = {
  background: "#171717",
  backgroundSecondary: "#262626",
  textPrimary: "#f5f5f5",
  textSecondary: "#a3a3a3",
  textTertiary: "#737373",
  textMuted: "#a3a3a3",
  border: "#404040",
  divider: "#404040",
  inputText: "#f5f5f5",
  inputPlaceholder: "#737373",
  inputBackground: "#262626",
  accent: "#10b981",
  accentDisabled: "#065f46",
  googleButtonBg: "#262626",
  googleButtonText: "#f5f5f5",
  googleButtonBorder: "#404040",
  appleButtonBg: "#ffffff",
  appleButtonText: "#000000",
  buttonSecondaryBg: "#525252",
  error: "#f87171",
  danger: "#ef4444",
  activityIndicator: "#f5f5f5",
};

export const useLoginTheme = (overrides?: Partial<LoginColors>) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const base = isDark ? darkColors : lightColors;
  const colors: LoginColors = overrides ? { ...base, ...overrides } : base;
  return { colors, isDark };
};

export const useTheme = (overrides?: Partial<AppColors>) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const base = isDark ? darkColors : lightColors;
  const colors: AppColors = overrides ? { ...base, ...overrides } : base;
  return { colors, isDark };
};
