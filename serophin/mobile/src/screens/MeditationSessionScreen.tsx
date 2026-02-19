import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Square } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GradientBackground } from "../components/GradientBackground";
import { SessionTimer } from "../components/SessionTimer";
import { DEFAULTS, GUIDANCE_LEVELS } from "../data/defaults";
import { gentleSchedule, guidedSchedule } from "../data/guidanceSchedule";
import { ensureAudioFile, preDownloadGuidanceAudio } from "../hooks/audioCache";
import { useBackgroundSound } from "../hooks/useBackgroundSound";
import { useBellSchedule } from "../hooks/useBellSchedule";
import { useGuidanceAudio } from "../hooks/useGuidanceAudio";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "MeditationSession">;

export const MeditationSessionScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences } = usePreferences();

  const guidanceLevel = preferences.guidanceLevel ?? DEFAULTS.meditation.guidanceLevel;
  const duration = preferences.meditationDuration ?? DEFAULTS.meditation.duration;
  const sound = preferences.meditationSound ?? DEFAULTS.meditation.sound;

  // Download all cue files before starting the session
  const needsCues = guidanceLevel >= 2;
  const [cuesReady, setCuesReady] = useState(!needsCues);

  useEffect(() => {
    if (!needsCues) {
      setCuesReady(true);
      return;
    }
    let cancelled = false;
    const schedule = guidanceLevel === 3 ? (guidedSchedule[duration] ?? []) : (gentleSchedule[duration] ?? []);
    const initialFilenames = schedule.filter(([time]) => time <= 30).map(([, name]) => `meditation/${name}_bm.m4a`);
    const remainingFilenames = schedule.filter(([time]) => time > 30).map(([, name]) => `meditation/${name}_bm.m4a`);
    preDownloadGuidanceAudio(initialFilenames).then(() => {
      if (!cancelled) {
        setCuesReady(true);
        // Download remaining cues in background
        preDownloadGuidanceAudio(remainingFilenames);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [needsCues, guidanceLevel, duration]);

  // Pre-download background sound file
  const needsSound = sound !== "none";
  const [soundReady, setSoundReady] = useState(!needsSound);

  useEffect(() => {
    if (!needsSound) {
      setSoundReady(true);
      return;
    }
    let cancelled = false;
    ensureAudioFile(`${sound}.m4a`)
      .then(() => {
        if (!cancelled) {
          setSoundReady(true);
        }
      })
      .catch((e) => {
        console.warn("MeditationSession: background sound download failed", e);
        if (!cancelled) {
          setSoundReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [needsSound, sound]);

  const sessionReady = cuesReady && soundReady;

  const { duck, unduck } = useBackgroundSound({ sound, isActive: sessionReady, durationMinutes: duration });
  const endDoubleBell = guidanceLevel <= 1 && sound === "none";
  const { skipForward: bellSkipForward } = useBellSchedule(guidanceLevel === 1, duration, endDoubleBell);
  const { skipForward: guidanceSkipForward } = useGuidanceAudio({
    guidanceLevel,
    durationMinutes: duration,
    isActive: sessionReady,
    onDuck: duck,
    onUnduck: unduck,
  });

  const guidanceLabel = GUIDANCE_LEVELS[guidanceLevel]?.label ?? "Gentle";

  const handleStop = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleComplete = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSkipForward = useCallback(
    (seconds: number) => {
      bellSkipForward(seconds);
      guidanceSkipForward(seconds);
    },
    [bellSkipForward, guidanceSkipForward],
  );

  if (!sessionReady) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.textMuted} />
          <Text style={[styles.preparingText, { color: colors.textMuted }]}>Preparing session…</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Meditation · {guidanceLabel}</Text>
        <SessionTimer durationMinutes={duration} isActive onComplete={handleComplete} onSkipForward={handleSkipForward} />
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
  preparingText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Nunito-SemiBold",
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
