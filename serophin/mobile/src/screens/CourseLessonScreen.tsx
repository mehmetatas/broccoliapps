import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, Lock, Pause, Play } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GradientBackground } from "../components/GradientBackground";
import { getCourseData, getLevelTitle, LESSON_DURATION_MINUTES } from "../data/course-data";
import { usePurchase } from "../hooks/usePurchase";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "CourseLesson">;

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const CourseLessonScreen = ({ navigation, route }: Props) => {
  const { level, lesson: lessonNumber } = route.params;
  const { colors } = useTheme();
  const { hasCourseAccess } = usePurchase();

  const courseData = useMemo(() => getCourseData(), []);
  const lessonData = useMemo(() => courseData.find((l) => l.level === level && l.lesson === lessonNumber), [courseData, level, lessonNumber]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = (lessonData?.durationMinutes ?? LESSON_DURATION_MINUTES) * 60;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= totalSeconds - 1) {
            clearTimer();
            setIsPlaying(false);
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [isPlaying, totalSeconds, clearTimer]);

  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // If no course access, show locked state
  if (!hasCourseAccess) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
              <ChevronLeft size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lesson</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.lockedContainer}>
            <Lock size={48} color={colors.textMuted} />
            <Text style={[styles.lockedTitle, { color: colors.textPrimary }]}>Course Locked</Text>
            <Text style={[styles.lockedSubtitle, { color: colors.textMuted }]}>Purchase the course to access all 30 guided meditation lessons.</Text>
            <TouchableOpacity style={[styles.backToCourseButton, { backgroundColor: colors.accent }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.backToCourseText}>Back to Course</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lesson {lessonNumber}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.playerContainer}>
          <Text style={[styles.levelLabel, { color: colors.textMuted }]}>
            Level {level}: {getLevelTitle(level)}
          </Text>
          <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>{lessonData?.title ?? `Lesson ${lessonNumber}`}</Text>
          <Text style={[styles.durationLabel, { color: colors.textMuted }]}>{lessonData?.durationMinutes ?? LESSON_DURATION_MINUTES} min</Text>

          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: colors.textPrimary }]}>{formatTime(elapsedSeconds)}</Text>
            <Text style={[styles.timerSeparator, { color: colors.textMuted }]}> / </Text>
            <Text style={[styles.timerTotal, { color: colors.textMuted }]}>{formatTime(totalSeconds)}</Text>
          </View>

          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBar, { backgroundColor: colors.accent, width: `${progress * 100}%` }]} />
          </View>

          <TouchableOpacity style={[styles.playPauseButton, { backgroundColor: colors.accent }]} onPress={handlePlayPause} activeOpacity={0.8}>
            {isPlaying ? <Pause size={28} color="#FFFFFF" /> : <Play size={28} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
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
  playerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  levelLabel: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  durationLabel: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    marginBottom: 32,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  timerText: {
    fontSize: 40,
    fontFamily: "Nunito-Bold",
    fontVariant: ["tabular-nums"],
  },
  timerSeparator: {
    fontSize: 24,
    fontFamily: "Nunito-Regular",
  },
  timerTotal: {
    fontSize: 24,
    fontFamily: "Nunito-Regular",
    fontVariant: ["tabular-nums"],
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 32,
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  lockedTitle: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    marginTop: 8,
  },
  lockedSubtitle: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  backToCourseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  backToCourseText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    color: "#FFFFFF",
  },
});
