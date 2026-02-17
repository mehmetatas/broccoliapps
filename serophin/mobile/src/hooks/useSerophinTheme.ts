import { useTheme as useBaseTheme } from "@broccoliapps/mobile";

export const useTheme = () => {
  const { colors, isDark } = useBaseTheme();
  return {
    colors: { ...colors, background: isDark ? "#162028" : "#F0E8E0" },
    isDark,
  };
};
