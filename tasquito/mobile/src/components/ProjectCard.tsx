import { SwipeAction, useTheme } from "@broccoliapps/mobile";
import type { ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { Archive, Trash2 } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

type Props = {
  project: ProjectSummaryDto;
  onPress?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
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
          borderBottomColor: colors.divider,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{project.name}</Text>
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
          <SwipeAction
            translation={translation}
            icon={Icon}
            label={label}
            bgColor={bgColor}
            onAction={onAction ?? (() => {})}
            swipeableMethods={swipeableMethods}
          />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 0,
  },
  content: {
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontFamily: "Nunito-SemiBold",
  },
  summary: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
});
