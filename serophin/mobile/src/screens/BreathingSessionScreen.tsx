import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Square } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BreathingCircle } from "../components/BreathingCircle";
import { GradientBackground } from "../components/GradientBackground";
import { KeepAwakeNotice } from "../components/KeepAwakeNotice";
import { SessionTimer } from "../components/SessionTimer";
import { BREATHING_PATTERNS, DEFAULTS } from "../data/defaults";
import { useBackgroundSound } from "../hooks/useBackgroundSound";
import { useDimScreen } from "../hooks/useDimScreen";
import { useHaptics } from "../hooks/useHaptics";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "BreathingSession">;

const COMPLETION_MESSAGES = [
  "That was good for you.",
  "Glad you took that moment.",
  "You needed that, didn't you?",
  "Good. Really good.",
  "That's how you take care of yourself.",
  "A few minutes just for you. Worth it.",
  "You gave yourself a break. Nice.",
  "That felt good, right?",
  "Look at you, taking care of yourself.",
  "Small pause, big difference.",
  "You took a breath. Literally.",
  "That was just for you.",
  "A little better now, yeah?",
  "You made time for this. Good.",
  "That's what you needed.",
  "You paused. That matters.",
  "Nice work taking that break.",
  "You showed yourself some care.",
  "That was time well spent.",
  "Good on you for doing this.",
];

export const BreathingSessionScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences } = usePreferences();

  const pattern = preferences.breathingPattern ?? DEFAULTS.breathing.pattern;
  const duration = preferences.breathingDuration ?? DEFAULTS.breathing.duration;
  const sound = preferences.breathingSound ?? DEFAULTS.breathing.sound;
  const hapticsEnabled = preferences.breathingHaptics ?? DEFAULTS.breathing.haptics;
  const [phase, setPhase] = useState<"active" | "completed">("active");
  const isActive = phase === "active";
  const patternTiming = BREATHING_PATTERNS[pattern];

  const { complete: hapticDone } = useHaptics(hapticsEnabled);
  useBackgroundSound({ sound, isActive, durationMinutes: duration });
  useDimScreen(isActive);

  const handleStop = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleComplete = useCallback(() => {
    hapticDone();
    setPhase("completed");
  }, [hapticDone]);

  const completionMessage = useMemo(() => COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]!, []);

  if (phase === "completed") {
    return (
      <GradientBackground>
        <Animated.View entering={FadeIn.duration(1000).delay(1000)} style={styles.completedContainer}>
          <Text style={[styles.completedTitle, { color: colors.textPrimary }]}>{completionMessage}</Text>
          <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.accent }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Animated.View exiting={FadeOut.duration(1000)} style={styles.activeContainer}>
        <Text style={[styles.activeTitle, { color: colors.textMuted }]}>{patternTiming.label}</Text>
        <BreathingCircle pattern={patternTiming} isActive={isActive} haptics={hapticsEnabled} />
        <SessionTimer durationMinutes={duration} isActive={isActive} onComplete={handleComplete} />
        <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.error }]} onPress={handleStop} activeOpacity={0.8}>
          <Square size={20} color="#FFFFFF" />
          <Text style={styles.stopButtonText}>End</Text>
        </TouchableOpacity>
        <KeepAwakeNotice hapticsEnabled={hapticsEnabled} />
      </Animated.View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  activeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  activeTitle: {
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    marginBottom: 8,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 16,
  },
  stopButtonText: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  completedTitle: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
    marginBottom: 48,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
  },
  doneButtonText: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
});
