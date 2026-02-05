import type { ReactNode } from "react";
import { useEffect } from "react";
import { Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "./theme";

export type BottomModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  headerRight?: ReactNode;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SLIDE_DURATION = 300;
const DISMISS_THRESHOLD = 100;

export const BottomModal = ({ visible, onClose, title, children, headerRight }: BottomModalProps) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: SLIDE_DURATION });
    } else {
      translateY.value = SCREEN_HEIGHT;
    }
  }, [visible, translateY]);

  const handleClose = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: SLIDE_DURATION }, () => {
      scheduleOnRN(onClose);
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd(() => {
      if (translateY.value > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: SLIDE_DURATION }, () => {
          scheduleOnRN(onClose);
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <GestureHandlerRootView style={styles.flex}>
        <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.backdrop} onPress={handleClose} />
          <Animated.View style={[styles.container, { backgroundColor: colors.background }, animatedStyle]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.handleRow}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>
            </GestureDetector>
            {title && (
              <View style={[styles.header, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
                {headerRight ?? (
                  <TouchableOpacity onPress={handleClose} hitSlop={8} activeOpacity={0.6}>
                    <Text style={[styles.closeButton, { color: colors.textMuted }]}>{"\u2715"}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  container: {
    maxHeight: "85%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Nunito-SemiBold",
  },
  closeButton: {
    fontSize: 18,
    lineHeight: 22,
  },
  content: {},
});
