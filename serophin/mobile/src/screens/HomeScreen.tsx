import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Brain, Moon, Play, Settings, Wind } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GradientBackground } from "../components/GradientBackground";
import { BACKGROUND_SOUNDS, BREATHING_PATTERNS, DEFAULTS, GUIDANCE_LEVELS } from "../data/defaults";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type Card = {
  title: string;
  subtitle: string;
  icon: typeof Brain;
  screen: keyof RootStackParamList;
  sessionScreen?: keyof RootStackParamList;
  gradient: string;
};

const cards: Card[] = [
  {
    title: "Meditation",
    subtitle: "Guided & unguided sessions",
    icon: Brain,
    screen: "Meditation",
    sessionScreen: "MeditationSession",
    gradient: "#6C63FF",
  },
  {
    title: "Breathing",
    subtitle: "Calming breathing exercises",
    icon: Wind,
    screen: "Breathing",
    sessionScreen: "BreathingSession",
    gradient: "#4ECDC4",
  },
  {
    title: "Sleep",
    subtitle: "Soothing sleep sounds",
    icon: Moon,
    screen: "Sleep",
    sessionScreen: "SleepSession",
    gradient: "#45B7D1",
  },
  // TODO: Course card hidden for now
  // {
  //   title: "Course",
  //   subtitle: "30-lesson meditation course",
  //   icon: GraduationCap,
  //   screen: "Course",
  //   gradient: "#F7B731",
  // },
];

export const HomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { preferences } = usePreferences();

  const meditationDuration = preferences.meditationDuration ?? DEFAULTS.meditation.duration;
  const meditationSound = preferences.meditationSound ?? DEFAULTS.meditation.sound;
  const guidanceLevel = preferences.guidanceLevel ?? DEFAULTS.meditation.guidanceLevel;
  const guidanceLabel = GUIDANCE_LEVELS[guidanceLevel]?.label ?? "Gentle";
  const meditationSummary = [`${meditationDuration} min`, meditationSound !== "none" ? (BACKGROUND_SOUNDS[meditationSound] ?? "") : "", guidanceLabel]
    .filter(Boolean)
    .join(" · ");

  const breathingDuration = preferences.breathingDuration ?? DEFAULTS.breathing.duration;
  const breathingSound = preferences.breathingSound ?? DEFAULTS.breathing.sound;
  const breathingPattern = preferences.breathingPattern ?? DEFAULTS.breathing.pattern;
  const patternLabel = BREATHING_PATTERNS[breathingPattern]?.label ?? "Relaxing";
  const breathingHaptics = preferences.breathingHaptics ?? DEFAULTS.breathing.haptics;
  const breathingSummary = [
    `${breathingDuration} min`,
    breathingSound !== "none" ? (BACKGROUND_SOUNDS[breathingSound] ?? "") : "",
    patternLabel,
    breathingHaptics ? "Haptics" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const sleepDuration = preferences.sleepDuration ?? DEFAULTS.sleep.duration;
  const sleepSound = preferences.sleepSound ?? DEFAULTS.sleep.sound;
  const sleepSoundLabel = BACKGROUND_SOUNDS[sleepSound] ?? "Brown Noise";
  const sleepSummary = [sleepDuration === 0 ? "Continuous" : `${sleepDuration} min`, sleepSoundLabel].join(" · ");

  const summaries: Record<string, string> = {
    Meditation: meditationSummary,
    Breathing: breathingSummary,
    Sleep: sleepSummary,
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Serophin</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")} activeOpacity={0.7}>
            <Settings size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.cardList} showsVerticalScrollIndicator={false}>
          {cards.map((card) => {
            const Icon = card.icon;
            const summary = summaries[card.title];
            return (
              <TouchableOpacity
                key={card.title}
                style={[styles.card, { backgroundColor: card.gradient }]}
                onPress={() => navigation.navigate(card.screen as never)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                  </View>
                  <View style={styles.cardIconContainer}>
                    <Icon size={48} color="rgba(255, 255, 255, 0.9)" />
                  </View>
                </View>
                {card.sessionScreen && summary && (
                  <>
                    <View style={styles.cardSeparator} />
                    <View style={styles.cardBottomRow}>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate(card.sessionScreen as never);
                        }}
                        activeOpacity={0.7}
                      >
                        <Play size={14} color="rgba(255, 255, 255, 0.8)" fill="rgba(255, 255, 255, 0.8)" />
                      </TouchableOpacity>
                      <Text style={styles.cardSummary}>{summary}</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito-Bold",
  },
  cardList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 120,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    color: "rgba(255, 255, 255, 0.85)",
  },
  cardSeparator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 24,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 10,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSummary: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
    color: "rgba(255, 255, 255, 0.7)",
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
