import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export const usePulseAnimation = (min = 0.3, max = 1, duration = 800): Animated.Value => {
  const opacity = useRef(new Animated.Value(min)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: max,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: min,
          duration,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, min, max, duration]);

  return opacity;
};
