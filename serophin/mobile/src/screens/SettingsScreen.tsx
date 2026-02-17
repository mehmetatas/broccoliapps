import { ThemeSettings } from "@broccoliapps/mobile";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronLeft, RotateCcw } from "lucide-react-native";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePurchase } from "../hooks/usePurchase";
import { useTheme } from "../hooks/useSerophinTheme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export const SettingsScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { restore, isLoading } = usePurchase();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <ThemeSettings />

          <TouchableOpacity
            style={[styles.restoreButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => restore()}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <RotateCcw size={18} color={colors.textPrimary} />
                <Text style={[styles.restoreText, { color: colors.textPrimary }]}>Restore Purchases</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  restoreText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
});
