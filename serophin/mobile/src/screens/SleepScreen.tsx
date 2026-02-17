import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Play, Square } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DurationPicker } from "../components/DurationPicker";
import { SessionTimer } from "../components/SessionTimer";
import { SoundPicker } from "../components/SoundPicker";
import { BACKGROUND_SOUNDS, DEFAULTS, DURATION_OPTIONS, SLEEP_SOUNDS } from "../data/defaults";
import type { BackgroundSound, SleepSound } from "../data/types";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Sleep">;

export const SleepScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences, update } = usePreferences();

  const [sleepSound, setSleepSound] = useState<SleepSound>(DEFAULTS.sleep.sound);
  const [duration, setDuration] = useState<number>(DEFAULTS.sleep.duration);
  const [backgroundSound, setBackgroundSound] = useState<BackgroundSound>(DEFAULTS.sleep.backgroundSound);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load preferences
  useEffect(() => {
    if (preferences.sleepSound) {
      setSleepSound(preferences.sleepSound);
    }
    if (preferences.sleepDuration) {
      setDuration(preferences.sleepDuration);
    }
    if (preferences.sleepBackgroundSound) {
      setBackgroundSound(preferences.sleepBackgroundSound);
    }
  }, [preferences]);

  const handleSleepSoundChange = useCallback(
    (value: string) => {
      setSleepSound(value as SleepSound);
      update({ sleepSound: value as SleepSound });
    },
    [update],
  );

  const handleDurationChange = useCallback(
    (value: number) => {
      setDuration(value);
      update({ sleepDuration: value });
    },
    [update],
  );

  const handleBackgroundSoundChange = useCallback(
    (value: string) => {
      setBackgroundSound(value as BackgroundSound);
      update({ sleepBackgroundSound: value as BackgroundSound });
    },
    [update],
  );

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleComplete = useCallback(() => {
    setIsPlaying(false);
  }, []);

  if (isPlaying) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
        <View style={styles.activeContainer}>
          <Text style={[styles.activeTitle, { color: colors.textPrimary }]}>{SLEEP_SOUNDS[sleepSound]}</Text>
          <Text style={[styles.activeSubtitle, { color: colors.textMuted }]}>Playing now</Text>
          <SessionTimer durationMinutes={duration} isActive={isPlaying} onComplete={handleComplete} />
          <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.error }]} onPress={handleStop} activeOpacity={0.8}>
            <Square size={20} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Sleep</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Sleep Sound</Text>
            <SoundPicker sounds={SLEEP_SOUNDS} selected={sleepSound} onSelect={handleSleepSoundChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Duration</Text>
            <DurationPicker options={DURATION_OPTIONS.sleep} selected={duration} onSelect={handleDurationChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Background Sound</Text>
            <SoundPicker sounds={BACKGROUND_SOUNDS} selected={backgroundSound} onSelect={handleBackgroundSoundChange} />
          </View>

          <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.accent }]} onPress={handlePlay} activeOpacity={0.8}>
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    marginBottom: 4,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  playButtonText: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
  activeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  activeTitle: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    marginBottom: 4,
  },
  activeSubtitle: {
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
