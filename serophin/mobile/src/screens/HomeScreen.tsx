import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Brain, GraduationCap, Moon, Settings, Wind } from "lucide-react-native";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

type CardItem = {
  title: string;
  subtitle: string;
  icon: typeof Brain;
  screen: keyof RootStackParamList;
  gradient: string;
};

const cards: CardItem[] = [
  {
    title: "Meditation",
    subtitle: "Guided & unguided sessions",
    icon: Brain,
    screen: "Meditation",
    gradient: "#6C63FF",
  },
  {
    title: "Breathing",
    subtitle: "Calming breathing exercises",
    icon: Wind,
    screen: "Breathing",
    gradient: "#4ECDC4",
  },
  {
    title: "Sleep",
    subtitle: "Soothing sleep sounds",
    icon: Moon,
    screen: "Sleep",
    gradient: "#45B7D1",
  },
  {
    title: "Course",
    subtitle: "30-lesson meditation course",
    icon: GraduationCap,
    screen: "Course",
    gradient: "#F7B731",
  },
];

export const HomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Serophin</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")} activeOpacity={0.7} style={styles.settingsButton}>
            <Settings size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.cardList} showsVerticalScrollIndicator={false}>
          {cards.map((card) => {
            const Icon = card.icon;
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
              </TouchableOpacity>
            );
          })}
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
  settingsButton: {
    padding: 4,
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
  cardIconContainer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
