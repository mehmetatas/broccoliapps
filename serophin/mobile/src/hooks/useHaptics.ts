import { useCallback, useMemo } from "react";
import BackgroundTimer from "react-native-background-timer";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import type { BreathingPhase } from "../data/types";

const hapticOptions = { enableVibrateFallback: true, ignoreAndroidSystemSettings: true };

export const useHaptics = (enabled: boolean) => {
  const hapticFeedback = useCallback(() => {
    if (!enabled) {
      return;
    }
    ReactNativeHapticFeedback.trigger("impactHeavy", hapticOptions);
  }, [enabled]);

  const complete = useCallback(() => {
    if (!enabled) {
      return;
    }
    ReactNativeHapticFeedback.trigger("notificationSuccess", hapticOptions);
  }, [enabled]);

  const phase = useCallback(
    (p: BreathingPhase) => {
      if (!enabled) {
        return;
      }
      const count = p === "inhale" ? 1 : p === "exhale" ? 4 : 2;
      for (let i = 0; i < count; i++) {
        BackgroundTimer.setTimeout(complete, i * 175);
      }
    },
    [enabled, complete],
  );

  return useMemo(() => ({ hapticFeedback, complete, phase }), [hapticFeedback, complete, phase]);
};
