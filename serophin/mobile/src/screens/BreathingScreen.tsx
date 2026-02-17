import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Pause, Play } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { SafeAreaView } from "react-native-safe-area-context";
import { BreathingCircle } from "../components/BreathingCircle";
import { DurationPicker } from "../components/DurationPicker";
import { SessionTimer } from "../components/SessionTimer";
import { SoundPicker } from "../components/SoundPicker";
import { BACKGROUND_SOUNDS, BREATHING_PATTERNS, DEFAULTS, DURATION_OPTIONS } from "../data/defaults";
import type { BackgroundSound, BreathingPattern } from "../data/types";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Breathing">;

export const BreathingScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences, update } = usePreferences();

  const [pattern, setPattern] = useState<BreathingPattern>(DEFAULTS.breathing.pattern);
  const [duration, setDuration] = useState<number>(DEFAULTS.breathing.duration);
  const [sound, setSound] = useState<BackgroundSound>(DEFAULTS.breathing.sound);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(DEFAULTS.breathing.haptics);
  const [isActive, setIsActive] = useState(false);

  // Load preferences
  useEffect(() => {
    if (preferences.breathingPattern) {
      setPattern(preferences.breathingPattern);
    }
    if (preferences.breathingDuration) {
      setDuration(preferences.breathingDuration);
    }
    if (preferences.breathingSound) {
      setSound(preferences.breathingSound);
    }
    if (preferences.breathingHaptics !== undefined) {
      setHapticsEnabled(preferences.breathingHaptics);
    }
  }, [preferences]);

  const handlePatternChange = useCallback(
    (value: BreathingPattern) => {
      setPattern(value);
      update({ breathingPattern: value });
    },
    [update],
  );

  const handleDurationChange = useCallback(
    (value: number) => {
      setDuration(value);
      update({ breathingDuration: value });
    },
    [update],
  );

  const handleSoundChange = useCallback(
    (value: string) => {
      setSound(value as BackgroundSound);
      update({ breathingSound: value as BackgroundSound });
    },
    [update],
  );

  const handleHapticsChange = useCallback(
    (value: boolean) => {
      setHapticsEnabled(value);
      update({ breathingHaptics: value });
    },
    [update],
  );

  const handleBegin = useCallback(() => {
    if (hapticsEnabled) {
      ReactNativeHapticFeedback.trigger("impactMedium");
    }
    setIsActive(true);
  }, [hapticsEnabled]);

  const handleStop = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleComplete = useCallback(() => {
    if (hapticsEnabled) {
      ReactNativeHapticFeedback.trigger("notificationSuccess");
    }
    setIsActive(false);
  }, [hapticsEnabled]);

  const patternTiming = BREATHING_PATTERNS[pattern];

  if (isActive) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
        <View style={styles.activeContainer}>
          <Text style={[styles.activeTitle, { color: colors.textMuted }]}>{patternTiming.label}</Text>
          <BreathingCircle pattern={patternTiming} isActive={isActive} haptics={hapticsEnabled} />
          <SessionTimer durationMinutes={duration} isActive={isActive} onComplete={handleComplete} />
          <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.error }]} onPress={handleStop} activeOpacity={0.8}>
            <Pause size={24} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>End Session</Text>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Breathing</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pattern</Text>
            <View style={styles.patternGrid}>
              {(Object.entries(BREATHING_PATTERNS) as [BreathingPattern, typeof patternTiming][]).map(([key, value]) => (
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
                  <Text style={[styles.patternLabel, { color: colors.textPrimary }, pattern === key && { color: "#FFFFFF" }]}>{value.label}</Text>
                  <Text style={[styles.patternTiming, { color: colors.textMuted }, pattern === key && { color: "rgba(255, 255, 255, 0.8)" }]}>
                    {value.inhale}-{value.hold > 0 ? `${value.hold}-` : ""}
                    {value.exhale}
                    {value.holdAfter > 0 ? `-${value.holdAfter}` : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Duration</Text>
            <DurationPicker options={DURATION_OPTIONS.breathing} selected={duration} onSelect={handleDurationChange} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Background Sound</Text>
            <SoundPicker sounds={BACKGROUND_SOUNDS} selected={sound} onSelect={handleSoundChange} />
          </View>

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Haptic Feedback</Text>
              <Switch value={hapticsEnabled} onValueChange={handleHapticsChange} trackColor={{ true: colors.accent }} />
            </View>
          </View>

          <TouchableOpacity style={[styles.beginButton, { backgroundColor: colors.accent }]} onPress={handleBegin} activeOpacity={0.8}>
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.beginButtonText}>Begin</Text>
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
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
});
