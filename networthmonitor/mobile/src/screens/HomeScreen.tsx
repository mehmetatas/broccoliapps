import { useTheme } from "@broccoliapps/mobile";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export const HomeScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Net Worth Monitor</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your wealth, effortlessly</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => navigation.navigate("Details")}>
        <Text style={styles.buttonText}>Go to Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "Nunito-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Nunito-Regular",
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    color: "#ffffff",
  },
});
