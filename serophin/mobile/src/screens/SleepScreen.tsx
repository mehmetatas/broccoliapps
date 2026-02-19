import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Play } from "lucide-react-native";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DurationPicker } from "../components/DurationPicker";
import { GradientBackground } from "../components/GradientBackground";
import { SoundPicker } from "../components/SoundPicker";
import { DEFAULTS, DURATION_OPTIONS, SLEEP_SOUNDS } from "../data/defaults";
import type { BackgroundSound } from "../data/types";
import { useBackgroundSound } from "../hooks/useBackgroundSound";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Sleep">;

export const SleepScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences, update } = usePreferences();

  const sleepSound = preferences.sleepSound ?? DEFAULTS.sleep.sound;
  const duration = preferences.sleepDuration ?? DEFAULTS.sleep.duration;

  const { preview: previewSleep } = useBackgroundSound({ sound: sleepSound, isActive: false, durationMinutes: duration });

  const handleSleepSoundChange = useCallback(
    (value: string) => {
      const soundId = value as BackgroundSound;
      update({ sleepSound: soundId });
      previewSleep(soundId);
    },
    [update, previewSleep],
  );

  const handleDurationChange = useCallback(
    (value: number) => {
      update({ sleepDuration: value });
    },
    [update],
  );

  const handlePlay = useCallback(() => {
    navigation.navigate("SleepSession");
  }, [navigation]);

  return (
    <GradientBackground>
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
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Duration</Text>
            <DurationPicker options={DURATION_OPTIONS.sleep} selected={duration} onSelect={handleDurationChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Background Sound</Text>
            <SoundPicker sounds={SLEEP_SOUNDS} selected={sleepSound} onSelect={handleSleepSoundChange} />
          </View>

          <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.accent }]} onPress={handlePlay} activeOpacity={0.8}>
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.playButtonText}>Start</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
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
});
