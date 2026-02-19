import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronDown, ChevronLeft, ChevronRight, Lock } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GradientBackground } from "../components/GradientBackground";
import { COURSE_LEVELS, COURSE_PRICE_USD, getCourseData, getLevelDescription, getLevelTitle } from "../data/course-data";
import { usePurchase } from "../hooks/usePurchase";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Course">;

export const CourseScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { hasCourseAccess, isLoading: isPurchaseLoading, isPurchasing, buy, restore } = usePurchase();
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1]));

  const courseData = useMemo(() => getCourseData(), []);

  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const lessonsForLevel = (level: number) => {
    return courseData.filter((lesson) => lesson.level === level);
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Course</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!hasCourseAccess && !isPurchaseLoading && (
            <>
              <TouchableOpacity onPress={buy} disabled={isPurchasing} activeOpacity={0.8}>
                <View style={[styles.purchaseBanner, { backgroundColor: colors.accent }]}>
                  {isPurchasing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Lock size={20} color="#FFFFFF" />}
                  <View style={styles.purchaseBannerText}>
                    <Text style={styles.purchaseTitle}>{isPurchasing ? "Processing..." : "Unlock Full Course"}</Text>
                    <Text style={styles.purchaseSubtitle}>30 guided lessons across 3 levels for ${COURSE_PRICE_USD.toFixed(2)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={restore} activeOpacity={0.7} style={styles.restoreLink}>
                <Text style={[styles.restoreText, { color: colors.textMuted }]}>Restore Purchases</Text>
              </TouchableOpacity>
            </>
          )}

          {isPurchaseLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.activityIndicator} />
            </View>
          )}

          {COURSE_LEVELS.map((level) => {
            const isExpanded = expandedLevels.has(level);
            const lessons = lessonsForLevel(level);

            return (
              <View key={level} style={[styles.levelSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.levelHeader} onPress={() => toggleLevel(level)} activeOpacity={0.7}>
                  <View style={styles.levelInfo}>
                    <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>
                      Level {level}: {getLevelTitle(level)}
                    </Text>
                    <Text style={[styles.levelDescription, { color: colors.textMuted }]} numberOfLines={isExpanded ? undefined : 1}>
                      {getLevelDescription(level)}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.textMuted} style={isExpanded ? styles.chevronExpanded : undefined} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.lessonList}>
                    {lessons.map((lesson, index) => (
                      <TouchableOpacity
                        key={`${lesson.level}-${lesson.lesson}`}
                        style={[
                          styles.lessonRow,
                          index < lessons.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
                        ]}
                        onPress={() => {
                          if (hasCourseAccess) {
                            navigation.navigate("CourseLesson", { level: lesson.level, lesson: lesson.lesson });
                          }
                        }}
                        activeOpacity={hasCourseAccess ? 0.6 : 1}
                      >
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonNumber, { color: colors.textMuted }]}>{lesson.lesson}</Text>
                          <View style={styles.lessonTextContainer}>
                            <Text style={[styles.lessonTitle, { color: colors.textPrimary }]}>{lesson.title}</Text>
                            <Text style={[styles.lessonDuration, { color: colors.textMuted }]}>{lesson.durationMinutes} min</Text>
                          </View>
                        </View>
                        {hasCourseAccess ? <ChevronRight size={18} color={colors.textMuted} /> : <Lock size={16} color={colors.textMuted} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
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
    gap: 16,
  },
  purchaseBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  purchaseBannerText: {
    flex: 1,
  },
  purchaseTitle: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
  purchaseSubtitle: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  levelSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  levelInfo: {
    flex: 1,
    gap: 4,
  },
  levelTitle: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
  },
  levelDescription: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  chevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  lessonList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lessonInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  lessonNumber: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    width: 24,
    textAlign: "center",
  },
  lessonTextContainer: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontFamily: "Nunito-SemiBold",
  },
  lessonDuration: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    marginTop: 2,
  },
  restoreLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
});
