import { useTheme } from "@broccoliapps/mobile";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

const SkeletonCard = () => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderBottomColor: colors.divider,
          opacity,
        },
      ]}
    >
      <View style={[styles.checkboxPlaceholder, { backgroundColor: colors.divider }]} />
      <View style={styles.textContainer}>
        <View style={[styles.titleBar, { backgroundColor: colors.divider }]} />
        <View style={[styles.subtitleBar, { backgroundColor: colors.divider }]} />
      </View>
    </Animated.View>
  );
};

export const TaskCardSkeleton = SkeletonCard;

export const TaskListSkeleton = () => {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 0,
    gap: 12,
  },
  checkboxPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  titleBar: {
    height: 16,
    borderRadius: 4,
    width: "60%",
  },
  subtitleBar: {
    height: 12,
    borderRadius: 4,
    width: "35%",
  },
});
