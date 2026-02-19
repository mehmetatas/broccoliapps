import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BackgroundTimer from "react-native-background-timer";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { BreathingPhase } from "../data/types";
import { useHaptics } from "../hooks/useHaptics";
import { useTheme } from "../hooks/useSerophinTheme";

type PatternTiming = {
  inhale: number;
  hold: number;
  exhale: number;
  holdAfter: number;
};

type Props = {
  pattern: PatternTiming;
  isActive: boolean;
  haptics: boolean;
};

const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: "Breathe In",
  hold: "Hold",
  exhale: "Breathe Out",
  holdAfter: "Hold",
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.0;

export const BreathingCircle = ({ pattern, isActive, haptics }: Props) => {
  const { colors } = useTheme();
  const { phase: triggerHaptic } = useHaptics(haptics);
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const scale = useSharedValue(MIN_SCALE);
  const timeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current !== null) {
      BackgroundTimer.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const runPhase = useCallback(
    (currentPhase: BreathingPhase) => {
      if (!isMountedRef.current) {
        return;
      }

      setPhase(currentPhase);
      triggerHaptic(currentPhase);

      const getNextPhase = (): BreathingPhase => {
        switch (currentPhase) {
          case "inhale":
            return pattern.hold > 0 ? "hold" : "exhale";
          case "hold":
            return "exhale";
          case "exhale":
            return pattern.holdAfter > 0 ? "holdAfter" : "inhale";
          case "holdAfter":
            return "inhale";
        }
      };

      const getPhaseDuration = (): number => {
        switch (currentPhase) {
          case "inhale":
            return pattern.inhale;
          case "hold":
            return pattern.hold;
          case "exhale":
            return pattern.exhale;
          case "holdAfter":
            return pattern.holdAfter;
        }
      };

      const duration = getPhaseDuration() * 1000;

      // Animate scale based on phase
      if (currentPhase === "inhale") {
        scale.value = withTiming(MAX_SCALE, { duration, easing: Easing.inOut(Easing.ease) });
      } else if (currentPhase === "exhale") {
        scale.value = withTiming(MIN_SCALE, { duration, easing: Easing.inOut(Easing.ease) });
      }
      // hold and holdAfter: no scale change

      timeoutRef.current = BackgroundTimer.setTimeout(() => {
        runPhase(getNextPhase());
      }, duration);
    },
    [pattern, scale, triggerHaptic],
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (isActive) {
      scale.value = MIN_SCALE;
      runPhase("inhale");
    } else {
      clearTimeouts();
      scale.value = MIN_SCALE;
      setPhase("inhale");
    }

    return () => {
      isMountedRef.current = false;
      clearTimeouts();
    };
  }, [isActive, runPhase, clearTimeouts, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.circleWrapper}>
        <Animated.View style={[styles.circle, { backgroundColor: colors.accent }, animatedStyle]} />
      </View>
      <Text style={[styles.phaseText, { color: colors.textPrimary }]}>{isActive ? PHASE_LABELS[phase] : "Ready"}</Text>
    </View>
  );
};

const CIRCLE_SIZE = 200;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    opacity: 0.6,
  },
  phaseText: {
    fontSize: 24,
    fontFamily: "Nunito-SemiBold",
  },
});
