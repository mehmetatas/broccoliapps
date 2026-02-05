import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type ThemePreference } from "./theme";
import type { AppColors } from "./types";

const STORAGE_KEY = "@broccoliapps/theme";

type ThemeContextType = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  colors: AppColors;
  isDark: boolean;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [isLoading, setIsLoading] = useState(true);
  const systemScheme = useColorScheme();

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreferenceState(stored);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadPreference();
  }, []);

  const setPreference = useCallback(async (newPreference: ThemePreference) => {
    setPreferenceState(newPreference);
    await AsyncStorage.setItem(STORAGE_KEY, newPreference);
  }, []);

  const isDark = useMemo(() => {
    if (preference === "system") {
      return systemScheme === "dark";
    }
    return preference === "dark";
  }, [preference, systemScheme]);

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      colors,
      isDark,
      isLoading,
    }),
    [preference, setPreference, colors, isDark, isLoading],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
};

export const useThemeContextOptional = (): ThemeContextType | undefined => {
  return useContext(ThemeContext);
};
