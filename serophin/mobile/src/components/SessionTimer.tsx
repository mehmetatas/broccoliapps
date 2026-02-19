import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BackgroundTimer from "react-native-background-timer";
import { useTheme } from "../hooks/useSerophinTheme";

type Props = {
  durationMinutes: number;
  isActive: boolean;
  onComplete: () => void;
  onSkipForward?: (seconds: number) => void;
};

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const SessionTimer = ({ durationMinutes, isActive, onComplete, onSkipForward }: Props) => {
  const { colors } = useTheme();
  const infinite = durationMinutes === 0;
  const totalSeconds = durationMinutes * 60;
  const [displaySeconds, setDisplaySeconds] = useState(infinite ? 0 : totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgTimeoutRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const startedAtRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset when duration changes or session restarts
  useEffect(() => {
    if (!isActive) {
      completedRef.current = false;
      setDisplaySeconds(infinite ? 0 : totalSeconds);
    }
  }, [totalSeconds, isActive, infinite]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (bgTimeoutRef.current !== null) {
      BackgroundTimer.clearTimeout(bgTimeoutRef.current);
      bgTimeoutRef.current = null;
    }
  }, []);

  const recalculate = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    if (infinite) {
      setDisplaySeconds(elapsed);
    } else {
      setDisplaySeconds(Math.max(0, totalSeconds - elapsed));
    }
  }, [infinite, totalSeconds]);

  useEffect(() => {
    if (isActive) {
      completedRef.current = false;
      startedAtRef.current = Date.now();
      setDisplaySeconds(infinite ? 0 : totalSeconds);

      intervalRef.current = setInterval(recalculate, 1000);

      // Native-thread timeout that fires even when screen is locked
      if (!infinite) {
        bgTimeoutRef.current = BackgroundTimer.setTimeout(() => {
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current();
          }
        }, totalSeconds * 1000);
      }

      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          recalculate();
        }
      });

      return () => {
        clearTimer();
        sub.remove();
      };
    }

    clearTimer();
    return undefined;
  }, [isActive, totalSeconds, infinite, clearTimer, recalculate]);

  // Fire onComplete outside the setState updater to avoid updating parent during render
  useEffect(() => {
    if (isActive && !infinite && displaySeconds === 0 && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current();
    }
  }, [isActive, infinite, displaySeconds]);

  const skipForward = useCallback(() => {
    startedAtRef.current -= 10_000;
    recalculate();
    onSkipForward?.(10);
  }, [recalculate, onSkipForward]);

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, { color: colors.textPrimary }]}>{formatTime(displaySeconds)}</Text>
      {__DEV__ && isActive && (
        <TouchableOpacity style={styles.skipButton} onPress={skipForward} activeOpacity={0.6}>
          <Text style={[styles.skipButtonText, { color: colors.textMuted }]}>+10s</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  timer: {
    fontSize: 64,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  skipButton: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
});
