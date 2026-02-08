import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from "react-native-reanimated";

type SwipeActionProps = {
  translation: SharedValue<number>;
  icon: LucideIcon;
  label?: string;
  bgColor: string;
  iconSize?: number;
  iconColor?: string;
  width?: number;
  onAction: () => void;
  swipeableMethods: SwipeableMethods;
};

export const SwipeAction = ({
  translation,
  icon: Icon,
  label,
  bgColor,
  iconSize = 20,
  iconColor = "#ffffff",
  width = 80,
  onAction,
  swipeableMethods,
}: SwipeActionProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translation.value, [-width, 0], [0, width], "clamp") }],
  }));

  return (
    <Animated.View style={[styles.container, { width }, animatedStyle]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: bgColor }]}
        onPress={() => {
          swipeableMethods.close();
          onAction();
        }}
        activeOpacity={0.7}
      >
        <Icon size={iconSize} color={iconColor} />
        {label && <Text style={styles.label}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  button: {
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  label: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
  },
});
