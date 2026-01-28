import { cache } from "@broccoliapps/browser";
import { CACHE_KEYS } from "../api/cache";

export type Theme = "system" | "light" | "dark";

/**
 * Get the stored theme from cache
 */
export const getStoredTheme = (): Theme => {
  return cache.get<Theme>(CACHE_KEYS.theme) ?? "system";
};

/**
 * Apply the given theme to the document
 */
export const applyTheme = (theme?: Theme): void => {
  const effectiveTheme = theme ?? getStoredTheme();
  const root = document.documentElement;

  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else if (effectiveTheme === "light") {
    root.classList.remove("dark");
  } else {
    // System preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
};

/**
 * Save and apply a theme
 */
export const setTheme = (theme: Theme): void => {
  cache.set(CACHE_KEYS.theme, theme);
  applyTheme(theme);
};

/**
 * Check if the current effective theme is dark
 */
export const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains("dark");
};
