import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, Modal as RNModal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "./theme";

export type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmVariant?: "primary" | "danger" | "warning";
};

const ANIMATION_DURATION = 200;

export const Modal = ({ visible, onClose, title, children, confirmText, cancelText = "Cancel", onConfirm, confirmVariant = "primary" }: ModalProps) => {
  const { colors } = useTheme();
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, { duration: ANIMATION_DURATION });
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
    } else {
      scale.value = 0.95;
      opacity.value = 0;
    }
  }, [visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const confirmBg = confirmVariant === "danger" ? colors.danger : confirmVariant === "warning" ? colors.warning : colors.accent;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.card, { backgroundColor: colors.background }, animatedStyle]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
          </View>

          {/* Body */}
          <View style={styles.body}>{children}</View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.divider, backgroundColor: colors.backgroundSecondary }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>{cancelText}</Text>
            </TouchableOpacity>
            {onConfirm && confirmText && (
              <TouchableOpacity style={[styles.confirmButton, { backgroundColor: confirmBg }]} onPress={onConfirm} activeOpacity={0.7}>
                <Text style={styles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    width: "85%",
    maxWidth: 360,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Nunito-SemiBold",
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Nunito-SemiBold",
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: "Nunito-SemiBold",
    color: "#ffffff",
  },
});
