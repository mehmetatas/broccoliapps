import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/useSerophinTheme";

type Props = {
  sounds: Record<string, string>;
  selected: string;
  onSelect: (value: string) => void;
};

export const SoundPicker = ({ sounds, selected, onSelect }: Props) => {
  const { colors } = useTheme();

  const entries = Object.entries(sounds);

  return (
    <View style={styles.grid}>
      {entries.map(([id, label]) => {
        const isSelected = id === selected;
        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
            onPress={() => onSelect(id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.cardText, { color: colors.textPrimary }, isSelected && { color: "#FFFFFF" }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 90,
    alignItems: "center",
  },
  cardText: {
    fontSize: 13,
    fontFamily: "Nunito-SemiBold",
  },
});
