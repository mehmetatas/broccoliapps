import { useTheme } from "@broccoliapps/mobile";
import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { Archive, Trash2 } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { ProjectStatusIndicator } from "./ProjectStatusIndicator";

type Props = {
  project: ProjectSummaryDto;
  onPress?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
};

const SwipeAction = ({
  translation,
  icon: Icon,
  label,
  bgColor,
  onAction,
  swipeableMethods,
}: {
  translation: SharedValue<number>;
  icon: typeof Archive;
  label: string;
  bgColor: string;
  onAction?: () => void;
  swipeableMethods: SwipeableMethods;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translation.value, [-80, 0], [0, 80], "clamp") }],
  }));

  return (
    <Animated.View style={[styles.swipeAction, animatedStyle]}>
      <TouchableOpacity
        style={[styles.swipeButton, { backgroundColor: bgColor }]}
        onPress={() => {
          swipeableMethods.close();
          onAction?.();
        }}
        activeOpacity={0.7}
      >
        <Icon size={20} color="#ffffff" />
        <Text style={styles.swipeText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ProjectCard = ({ project, onPress, onArchive, onDelete }: Props) => {
  const { colors } = useTheme();
  const isArchived = project.isArchived;

  const summaryText = isArchived ? "Archived" : project.totalTaskCount === 0 ? "No tasks" : `${project.openTaskCount} of ${project.totalTaskCount} open`;

  const cardContent = (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          opacity: isArchived ? 0.75 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {project.name}
          </Text>
          <ProjectStatusIndicator openTaskCount={project.openTaskCount} totalTaskCount={project.totalTaskCount} isArchived={isArchived} />
        </View>
        <Text style={[styles.summary, { color: colors.textMuted }]}>{summaryText}</Text>
      </View>
    </TouchableOpacity>
  );

  if ((!isArchived && onArchive) || (isArchived && onDelete)) {
    const isDeleteAction = isArchived && onDelete;
    const Icon = isDeleteAction ? Trash2 : Archive;
    const label = isDeleteAction ? "Delete" : "Archive";
    const bgColor = isDeleteAction ? "#e53e3e" : "#dd6b20";
    const onAction = isDeleteAction ? onDelete : onArchive;

    return (
      <ReanimatedSwipeable
        renderRightActions={(_progress, translation, swipeableMethods) => (
          <SwipeAction translation={translation} icon={Icon} label={label} bgColor={bgColor} onAction={onAction} swipeableMethods={swipeableMethods} />
        )}
        overshootRight={false}
      >
        {cardContent}
      </ReanimatedSwipeable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  swipeAction: {
    width: 80,
    marginBottom: 10,
  },
  swipeButton: {
    flex: 1,
    borderRadius: 12,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  swipeText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
  },
  content: {
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 17,
    fontFamily: "Nunito-SemiBold",
    flex: 1,
    marginRight: 12,
  },
  summary: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
});
