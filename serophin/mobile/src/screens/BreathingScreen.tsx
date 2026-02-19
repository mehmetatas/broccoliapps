import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Play } from "lucide-react-native";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { DurationPicker } from "../components/DurationPicker";
import { GradientBackground } from "../components/GradientBackground";
import { SoundPicker } from "../components/SoundPicker";
import { BACKGROUND_SOUNDS, BREATHING_PATTERNS, DEFAULTS, DURATION_OPTIONS } from "../data/defaults";
import type { BackgroundSound, BreathingPattern } from "../data/types";
import { useBackgroundSound } from "../hooks/useBackgroundSound";
import { useHaptics } from "../hooks/useHaptics";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Breathing">;

export const BreathingScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences, update } = usePreferences();

  const pattern = preferences.breathingPattern ?? DEFAULTS.breathing.pattern;
  const duration = preferences.breathingDuration ?? DEFAULTS.breathing.duration;
  const sound = preferences.breathingSound ?? DEFAULTS.breathing.sound;
  const hapticsEnabled = preferences.breathingHaptics ?? DEFAULTS.breathing.haptics;
  const _patternTiming = BREATHING_PATTERNS[pattern];

  const { hapticFeedback } = useHaptics(hapticsEnabled);
  const { preview } = useBackgroundSound({ sound, isActive: false, durationMinutes: duration });

  const handlePatternChange = useCallback(
    (value: BreathingPattern) => {
      update({ breathingPattern: value });
    },
    [update],
  );

  const handleDurationChange = useCallback(
    (value: number) => {
      update({ breathingDuration: value });
    },
    [update],
  );

  const handleSoundChange = useCallback(
    (value: string) => {
      const soundId = value as BackgroundSound;
      update({ breathingSound: soundId });
      preview(soundId);
    },
    [update, preview],
  );

  const handleHapticsChange = useCallback(
    (value: boolean) => {
      update({ breathingHaptics: value });
    },
    [update],
  );

  const handleBegin = useCallback(() => {
    hapticFeedback();
    navigation.navigate("BreathingSession");
  }, [hapticFeedback, navigation]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Breathing</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Duration</Text>
            <DurationPicker options={DURATION_OPTIONS.breathing} selected={duration} onSelect={handleDurationChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Background Sound</Text>
            <SoundPicker sounds={BACKGROUND_SOUNDS} selected={sound} onSelect={handleSoundChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pattern</Text>
            <View style={styles.patternGrid}>
              {(Object.entries(BREATHING_PATTERNS) as [BreathingPattern, typeof _patternTiming][]).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.patternCard,
                    { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
                    pattern === key && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                  onPress={() => handlePatternChange(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.patternLabel, { color: colors.textPrimary }, pattern === key && styles.patternLabelSelected]}>{value.label}</Text>
                  <Text style={[styles.patternTiming, { color: colors.textMuted }, pattern === key && styles.patternTimingSelected]}>
                    {value.inhale}-{value.hold > 0 ? `${value.hold}-` : ""}
                    {value.exhale}
                    {value.holdAfter > 0 ? `-${value.holdAfter}` : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin, { color: colors.textPrimary }]}>Haptic Feedback</Text>
              <Switch value={hapticsEnabled} onValueChange={handleHapticsChange} trackColor={{ true: colors.accent }} />
            </View>
            {hapticsEnabled && <Text style={[styles.hapticsHint, { color: colors.textPrimary }]}>Keep screen unlocked for haptic feedback</Text>}
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
  patternGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  patternCard: {
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  patternLabel: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
  patternTiming: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  patternLabelSelected: {
    color: "#FFFFFF",
  },
  patternTimingSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  sectionTitleNoMargin: {
    marginBottom: 0,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hapticsHint: {
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
