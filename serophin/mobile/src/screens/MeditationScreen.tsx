import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Pause, Play } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { DurationPicker } from "../components/DurationPicker";
import { SessionTimer } from "../components/SessionTimer";
import { SoundPicker } from "../components/SoundPicker";
import { BACKGROUND_SOUNDS, DEFAULTS, DURATION_OPTIONS, GUIDANCE_LEVELS } from "../data/defaults";
import type { BackgroundSound, GuidanceLevel } from "../data/types";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Meditation">;

const STEP_COUNT = GUIDANCE_LEVELS.length;
const THUMB_SIZE = 28;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.8 };

export const MeditationScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences, update } = usePreferences();

  const [guidanceLevel, setGuidanceLevel] = useState<GuidanceLevel>(DEFAULTS.meditation.guidanceLevel);
  const [duration, setDuration] = useState<number>(DEFAULTS.meditation.duration);
  const [sound, setSound] = useState<BackgroundSound>(DEFAULTS.meditation.sound);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(DEFAULTS.meditation.haptics);
  const [isActive, setIsActive] = useState(false);

  // Slider shared values (reanimated)
  const trackWidthVal = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const startX = useSharedValue(0);
  const currentLevelRef = useRef<GuidanceLevel>(DEFAULTS.meditation.guidanceLevel);

  const snapToLevel = useCallback(
    (level: GuidanceLevel) => {
      "worklet";
      const stepWidth = trackWidthVal.value / (STEP_COUNT - 1);
      thumbX.value = withSpring(level * stepWidth, SPRING_CONFIG);
    },
    [thumbX, trackWidthVal],
  );

  const onLevelChanged = useCallback(
    (level: GuidanceLevel) => {
      currentLevelRef.current = level;
      setGuidanceLevel(level);
      update({ guidanceLevel: level });
      if (hapticsEnabled) {
        ReactNativeHapticFeedback.trigger("impactLight");
      }
    },
    [update, hapticsEnabled],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-5, 5])
        .failOffsetY([-10, 10])
        .onStart(() => {
          startX.value = thumbX.value;
        })
        .onUpdate((e) => {
          const tw = trackWidthVal.value;
          if (tw <= 0) {
            return;
          }
          const newX = Math.max(0, Math.min(tw, startX.value + e.translationX));
          thumbX.value = newX;
        })
        .onEnd(() => {
          const tw = trackWidthVal.value;
          if (tw <= 0) {
            return;
          }
          const stepWidth = tw / (STEP_COUNT - 1);
          const snappedLevel = Math.round(thumbX.value / stepWidth);
          const clampedLevel = Math.max(0, Math.min(STEP_COUNT - 1, snappedLevel)) as GuidanceLevel;
          thumbX.value = withSpring(clampedLevel * stepWidth, SPRING_CONFIG);
          runOnJS(onLevelChanged)(clampedLevel);
        }),
    [thumbX, startX, trackWidthVal, onLevelChanged],
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const handleTrackLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      trackWidthVal.value = width;
      const stepWidth = width / (STEP_COUNT - 1);
      thumbX.value = currentLevelRef.current * stepWidth;
    },
    [trackWidthVal, thumbX],
  );

  const handleStepTap = useCallback(
    (level: GuidanceLevel) => {
      currentLevelRef.current = level;
      setGuidanceLevel(level);
      update({ guidanceLevel: level });
      snapToLevel(level);
      if (hapticsEnabled) {
        ReactNativeHapticFeedback.trigger("impactLight");
      }
    },
    [update, snapToLevel, hapticsEnabled],
  );

  // Load preferences
  useEffect(() => {
    if (preferences.guidanceLevel !== undefined) {
      const level = preferences.guidanceLevel;
      setGuidanceLevel(level);
      currentLevelRef.current = level;
      snapToLevel(level);
    }
    if (preferences.meditationDuration) {
      setDuration(preferences.meditationDuration);
    }
    if (preferences.meditationSound) {
      setSound(preferences.meditationSound);
    }
    if (preferences.meditationHaptics !== undefined) {
      setHapticsEnabled(preferences.meditationHaptics);
    }
  }, [preferences, snapToLevel]);

  const handleDurationChange = useCallback(
    (value: number) => {
      setDuration(value);
      update({ meditationDuration: value });
    },
    [update],
  );

  const handleSoundChange = useCallback(
    (value: string) => {
      setSound(value as BackgroundSound);
      update({ meditationSound: value as BackgroundSound });
    },
    [update],
  );

  const handleHapticsChange = useCallback(
    (value: boolean) => {
      setHapticsEnabled(value);
      update({ meditationHaptics: value });
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

  const guidanceLabel = GUIDANCE_LEVELS[guidanceLevel]?.label ?? "Medium";

  if (isActive) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
        <View style={styles.activeContainer}>
          <Text style={[styles.activeTitle, { color: colors.textPrimary }]}>Meditation · {guidanceLabel} Guidance</Text>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Meditation</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Guidance · {guidanceLabel}</Text>
            <View style={styles.sliderContainer}>
              <View style={[styles.sliderTrack, { backgroundColor: colors.backgroundSecondary }]} onLayout={handleTrackLayout}>
                <Animated.View style={[styles.sliderFill, { backgroundColor: colors.accent }, fillStyle]} />
                {GUIDANCE_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.sliderStep,
                      {
                        left: `${(level.value / (STEP_COUNT - 1)) * 100}%`,
                        backgroundColor: guidanceLevel >= level.value ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleStepTap(level.value)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                  />
                ))}
                <GestureDetector gesture={panGesture}>
                  <Animated.View
                    style={[styles.sliderThumb, { backgroundColor: colors.accent, borderColor: colors.background }, thumbStyle]}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  />
                </GestureDetector>
              </View>
              <View style={styles.sliderLabels}>
                {GUIDANCE_LEVELS.map((level) => (
                  <Text key={level.value} style={[styles.sliderLabel, { color: guidanceLevel === level.value ? colors.textPrimary : colors.textSecondary }]}>
                    {level.label}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Duration</Text>
            <DurationPicker options={DURATION_OPTIONS.meditation} selected={duration} onSelect={handleDurationChange} />
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
  sliderContainer: {
    paddingHorizontal: THUMB_SIZE / 2,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    justifyContent: "center",
    marginVertical: THUMB_SIZE / 2,
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  sliderStep: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -2,
    marginLeft: -5,
  },
  sliderThumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 3,
    top: -(THUMB_SIZE - 6) / 2,
    marginLeft: -(THUMB_SIZE / 2),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
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
