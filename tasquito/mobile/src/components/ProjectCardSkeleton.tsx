import { usePulseAnimation, useTheme } from "@broccoliapps/mobile";
import { Animated, StyleSheet, View } from "react-native";

const SkeletonCard = () => {
  const { colors } = useTheme();
  const opacity = usePulseAnimation();

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
      <View style={[styles.titleBar, { backgroundColor: colors.divider }]} />
      <View style={[styles.subtitleBar, { backgroundColor: colors.divider }]} />
    </Animated.View>
  );
};

export const ProjectListSkeleton = () => {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((i) => (
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  titleBar: {
    height: 18,
    borderRadius: 4,
    width: "60%",
  },
  subtitleBar: {
    height: 14,
    borderRadius: 4,
    width: "35%",
  },
});
