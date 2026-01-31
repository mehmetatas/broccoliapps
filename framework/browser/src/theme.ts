import { cache } from "./cache";

const THEME_CACHE_KEY = "cache:theme";

export type Theme = "system" | "light" | "dark";

export const getStoredTheme = (): Theme => {
  return cache.get<Theme>(THEME_CACHE_KEY) ?? "system";
};

export const applyTheme = (theme?: Theme): void => {
  const effectiveTheme = theme ?? getStoredTheme();
  const root = document.documentElement;

  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else if (effectiveTheme === "light") {
    root.classList.remove("dark");
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
};

export const setTheme = (theme: Theme): void => {
  cache.set(THEME_CACHE_KEY, theme);
  applyTheme(theme);
};

export const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains("dark");
};
