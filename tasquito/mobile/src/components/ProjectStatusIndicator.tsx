import { useTheme } from "@broccoliapps/mobile";
import { Archive } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

type ProjectStatus = "pending" | "active" | "done" | "archived";

type Props = {
  openTaskCount: number;
  totalTaskCount: number;
  isArchived?: boolean;
};

const getStatus = (openTaskCount: number, totalTaskCount: number, isArchived?: boolean): ProjectStatus => {
  if (isArchived) {
    return "archived";
  }
  if (totalTaskCount === 0) {
    return "pending";
  }
  if (openTaskCount === 0) {
    return "done";
  }
  return "active";
};

export const ProjectStatusIndicator = ({ openTaskCount, totalTaskCount, isArchived }: Props) => {
  const { colors } = useTheme();
  const status = getStatus(openTaskCount, totalTaskCount, isArchived);

  if (status === "archived") {
    return <Archive size={14} color={colors.textTertiary} />;
  }

  if (status === "done") {
    return <Text style={[styles.checkmark, { color: "#10b981" }]}>✓</Text>;
  }

  const dotColor = status === "active" ? "#3b82f6" : colors.textTertiary;

  const isFilled = status === "active";

  return (
    <View
      style={[
        styles.dot,
        {
          borderColor: dotColor,
          backgroundColor: isFilled ? dotColor : "transparent",
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 16,
  },
});
