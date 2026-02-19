import { Pills } from "@broccoliapps/mobile";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Play } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DurationPicker } from "../components/DurationPicker";
import { GradientBackground } from "../components/GradientBackground";
import { SoundPicker } from "../components/SoundPicker";
import { DEFAULTS, DURATION_OPTIONS, GUIDANCE_LEVELS, MEDITATION_SOUNDS } from "../data/defaults";
import { gentleSchedule, guidedSchedule } from "../data/guidanceSchedule";
import type { BackgroundSound, GuidanceLevel } from "../data/types";
import { preDownloadGuidanceAudio } from "../hooks/audioCache";
import { useBackgroundSound } from "../hooks/useBackgroundSound";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Meditation">;

const GUIDANCE_PILLS = GUIDANCE_LEVELS.map((l) => ({ value: String(l.value), label: l.label }));

const GUIDANCE_DESCRIPTIONS: Record<GuidanceLevel, string> = {
  0: "No guidance.",
  1: "Occasional bells to gently return your focus.",
  2: "Soft voice cues at key moments.",
  3: "Continuous voice guidance throughout.",
};

export const MeditationScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences, update } = usePreferences();

  const guidanceLevel = preferences.guidanceLevel ?? DEFAULTS.meditation.guidanceLevel;
  const duration = preferences.meditationDuration ?? DEFAULTS.meditation.duration;
  const sound = preferences.meditationSound ?? DEFAULTS.meditation.sound;
  const { preview } = useBackgroundSound({ sound, isActive: false, durationMinutes: duration });

  useEffect(() => {
    if (guidanceLevel >= 2) {
      const schedule = guidanceLevel === 3 ? (guidedSchedule[duration] ?? []) : (gentleSchedule[duration] ?? []);
      const filenames = schedule.map(([, name]) => `meditation/${name}_bm.m4a`);
      preDownloadGuidanceAudio(filenames);
    }
  }, [guidanceLevel, duration]);

  const handleDurationChange = useCallback(
    (value: number) => {
      update({ meditationDuration: value });
    },
    [update],
  );

  const handleSoundChange = useCallback(
    (value: string) => {
      const soundId = value as BackgroundSound;
      update({ meditationSound: soundId });
      preview(soundId);
    },
    [update, preview],
  );

  const handleGuidanceChange = useCallback(
    (value: string) => {
      update({ guidanceLevel: Number(value) as GuidanceLevel });
    },
    [update],
  );

  const handleBegin = useCallback(() => {
    navigation.navigate("MeditationSession");
  }, [navigation]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Meditation</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Duration</Text>
            <DurationPicker options={DURATION_OPTIONS.meditation} selected={duration} onSelect={handleDurationChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Background Sound</Text>
            <SoundPicker sounds={MEDITATION_SOUNDS} selected={sound} onSelect={handleSoundChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Guidance</Text>
            <Pills items={GUIDANCE_PILLS} selected={String(guidanceLevel)} onSelect={handleGuidanceChange} transparent />
            <Text style={[styles.guidanceDescription, { color: colors.textPrimary }]}>
              {GUIDANCE_DESCRIPTIONS[guidanceLevel]}
              {guidanceLevel <= 1 && sound === "none" ? " A double bell marks the end." : ""}
            </Text>
          </View>

          <TouchableOpacity style={[styles.beginButton, { backgroundColor: colors.accent }]} onPress={handleBegin} activeOpacity={0.8}>
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.beginButtonText}>Start</Text>
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
  guidanceDescription: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  beginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  beginButtonText: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
});
