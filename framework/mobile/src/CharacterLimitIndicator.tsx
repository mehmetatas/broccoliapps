import { type DimensionValue, StyleSheet, Text, View } from "react-native";
import { useTheme } from "./theme";

type CharacterLimitIndicatorProps = {
  textLength: number;
  softLimit: number;
};

export const CharacterLimitIndicator = ({ textLength, softLimit }: CharacterLimitIndicatorProps) => {
  const { colors } = useTheme();

  const ratio = textLength / softLimit;
  const overCount = textLength - softLimit;
  const barWidth: DimensionValue = `${Math.min(100, ratio * 100)}%`;

  const barColor = ratio >= 1 ? colors.error : ratio >= 0.9 ? colors.warning : ratio >= 0.8 ? "#f9731680" : "#3b82f680";

  return (
    <View>
      <View style={[styles.track, { backgroundColor: colors.divider }]}>
        <View style={[styles.bar, { backgroundColor: barColor, width: barWidth }]} />
      </View>
      {overCount > 0 ? (
        <Text style={[styles.counter, { color: colors.error }]}>
          Delete {overCount} {overCount === 1 ? "character" : "characters"}
        </Text>
      ) : (
        ratio >= 0.8 && <Text style={[styles.counter, { color: colors.textMuted }]}>{softLimit - textLength} remaining</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 2,
    borderRadius: 1,
  },
  bar: {
    height: 2,
    borderRadius: 1,
  },
  counter: {
    fontSize: 11,
    fontFamily: "Nunito-Regular",
    marginTop: 2,
  },
});
