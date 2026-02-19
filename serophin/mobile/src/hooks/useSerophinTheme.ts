import { useTheme as useBaseTheme } from "@broccoliapps/mobile";

export const useTheme = () => {
  const { colors } = useBaseTheme();
  return {
    colors: {
      ...colors,
      background: "transparent",
      backgroundSecondary: "rgba(255, 255, 255, 0.2)",
      backgroundTertiary: "rgba(255, 255, 255, 0.12)",
      border: "rgba(255, 255, 255, 0.3)",
      divider: "rgba(255, 255, 255, 0.25)",
    },
  };
};
