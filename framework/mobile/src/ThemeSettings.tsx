import { Monitor, Moon, Sun } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeContext } from "./ThemeContext";
import type { ThemePreference } from "./theme";

type ThemeOption = {
  value: ThemePreference;
  label: string;
  Icon: typeof Monitor;
};

const options: ThemeOption[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export const ThemeSettings = () => {
  const { preference, setPreference, colors } = useThemeContext();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Theme</Text>
      <View style={[styles.segmentedControl, { backgroundColor: colors.backgroundTertiary }]}>
        {options.map(({ value, label, Icon }) => {
          const isSelected = preference === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, isSelected && { backgroundColor: colors.background }]}
              onPress={() => setPreference(value)}
              activeOpacity={0.7}
            >
              <Icon size={18} color={isSelected ? colors.textPrimary : colors.textTertiary} />
              <Text style={[styles.segmentText, { color: isSelected ? colors.textPrimary : colors.textTertiary }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
});
