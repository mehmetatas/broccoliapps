import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/useSerophinTheme";

type Props = {
  durationMinutes: number;
  isActive: boolean;
  onComplete: () => void;
};

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const SessionTimer = ({ durationMinutes, isActive, onComplete }: Props) => {
  const { colors } = useTheme();
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset when duration changes or session restarts
  useEffect(() => {
    if (!isActive) {
      setRemainingSeconds(durationMinutes * 60);
    }
  }, [durationMinutes, isActive]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setRemainingSeconds(durationMinutes * 60);
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearTimer();
            onCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [isActive, durationMinutes, clearTimer]);

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, { color: colors.textPrimary }]}>{formatTime(remainingSeconds)}</Text>
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
});
