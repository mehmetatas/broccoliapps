import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Square } from "lucide-react-native";
import { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GradientBackground } from "../components/GradientBackground";
import { SessionTimer } from "../components/SessionTimer";
import { BACKGROUND_SOUNDS, DEFAULTS } from "../data/defaults";
import { useBackgroundSound } from "../hooks/useBackgroundSound";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SleepSession">;

export const SleepSessionScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences } = usePreferences();

  const sleepSound = preferences.sleepSound ?? DEFAULTS.sleep.sound;
  const duration = preferences.sleepDuration ?? DEFAULTS.sleep.duration;

  useBackgroundSound({ sound: sleepSound, isActive: true, durationMinutes: duration });

  const handleStop = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleComplete = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{BACKGROUND_SOUNDS[sleepSound]}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Playing now</Text>
        <SessionTimer durationMinutes={duration} isActive onComplete={handleComplete} />
        <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.error }]} onPress={handleStop} activeOpacity={0.8}>
          <Square size={20} color="#FFFFFF" />
          <Text style={styles.stopButtonText}>End</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    marginBottom: 16,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 32,
  },
  stopButtonText: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
});
