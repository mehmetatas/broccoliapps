import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PreferencesDto } from "../data/types";

const STORAGE_KEY = "serophin:preferences";

type PreferencesContextValue = {
  preferences: PreferencesDto;
  isLoading: boolean;
  error: string | null;
  update: (updates: Partial<PreferencesDto>) => void;
  refresh: () => void;
};

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export const usePreferencesProvider = () => {
  const [preferences, setPreferences] = useState<PreferencesDto>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPreferences(JSON.parse(raw) as PreferencesDto);
      }
    } catch (err) {
      console.error("[preferences] Failed to load:", err);
      setError("Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(async (updates: Partial<PreferencesDto>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(console.error);
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return {
    preferences,
    isLoading,
    error,
    update,
    refresh,
  };
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
};
