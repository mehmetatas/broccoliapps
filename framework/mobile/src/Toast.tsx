import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Toast } from "./useToast";
import { toastStore } from "./useToast";

const variantColors = {
  warning: { bg: "#fef3c7", border: "rgba(251, 191, 36, 0.5)", text: "#92400e", dismiss: "#b45309" },
  error: { bg: "#fee2e2", border: "rgba(248, 113, 113, 0.5)", text: "#991b1b", dismiss: "#991b1b" },
  info: { bg: "#dbeafe", border: "rgba(96, 165, 250, 0.5)", text: "#1e40af", dismiss: "#1e40af" },
  success: { bg: "#dcfce7", border: "rgba(74, 222, 128, 0.5)", text: "#166534", dismiss: "#166534" },
} as const;

type ToastItemProps = {
  toast: Toast;
};

export const ToastItem = ({ toast }: ToastItemProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  useEffect(() => {
    if (toast.delay === 0) {
      return;
    }
    const timer = setTimeout(() => {
      animateOut();
    }, toast.delay);
    return () => clearTimeout(timer);
  }, [toast.delay, toast.id]);

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      toastStore.remove(toast.id);
    });
  };

  const colors = variantColors[toast.variant];

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.outerContainer, { borderColor: colors.border, backgroundColor: colors.bg, opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.text }]}>{toast.message}</Text>
        <TouchableOpacity onPress={animateOut}>
          <Text style={[styles.dismiss, { color: colors.dismiss }]}>{"\u2715"}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
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
