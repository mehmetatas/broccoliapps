import { useAuth, useTheme } from "@broccoliapps/mobile";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Details">;

export function DetailsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Details</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>Navigation is working correctly.</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.buttonSecondaryBg }]} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.danger }]} onPress={() => logout()}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito-Bold",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signOutButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    color: "#ffffff",
  },
});
