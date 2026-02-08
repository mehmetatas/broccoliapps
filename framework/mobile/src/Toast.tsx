import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const variantColors = {
  warning: { bg: "#fef3c7", border: "#fbbf24", text: "#92400e", dismiss: "#b45309" },
  error: { bg: "#fef2f2", border: "#f87171", text: "#991b1b", dismiss: "#991b1b" },
  info: { bg: "#eff6ff", border: "#60a5fa", text: "#1e40af", dismiss: "#1e40af" },
  success: { bg: "#f0fdf4", border: "#4ade80", text: "#166534", dismiss: "#166534" },
} as const;

type ToastProps = {
  message: string;
  variant: keyof typeof variantColors;
  onDismiss?: () => void;
};

export const Toast = ({ message, variant, onDismiss }: ToastProps) => {
  const colors = variantColors[variant];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={[styles.dismiss, { color: colors.dismiss }]}>{"\u2715"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  dismiss: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
});
