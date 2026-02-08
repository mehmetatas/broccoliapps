import { COMMON_CACHE_KEYS } from "@broccoliapps/shared";
import { cache } from "./cache";

export type Theme = "system" | "light" | "dark";

export const getStoredTheme = (): Theme => {
  return cache.get<Theme>(COMMON_CACHE_KEYS.theme) ?? "system";
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
  cache.set(COMMON_CACHE_KEYS.theme, theme);
  applyTheme(theme);
};

export const isDarkMode = (): boolean => {
  return document.documentElement.classList.contains("dark");
};
