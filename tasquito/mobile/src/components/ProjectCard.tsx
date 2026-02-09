import { SwipeAction, useTheme } from "@broccoliapps/mobile";
import { LIMITS, type ProjectSummaryDto } from "@broccoliapps/tasquito-shared";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

type Props = {
  project: ProjectSummaryDto;
  onPress?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
};

export const ProjectCard = ({ project, onPress, onArchive, onUnarchive, onDelete }: Props) => {
  const { colors } = useTheme();
  const isArchived = project.isArchived;

  const daysLeft = (() => {
    if (!project.archivedAt) {
      return LIMITS.ARCHIVE_TTL_DAYS;
    }
    const elapsed = Math.floor((Date.now() - project.archivedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, LIMITS.ARCHIVE_TTL_DAYS - elapsed);
  })();
  const summaryText = isArchived
    ? `Deleting ${daysLeft < 1 ? "soon" : `in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}`
    : project.totalTaskCount === 0
      ? "No tasks"
      : `${project.openTaskCount} of ${project.totalTaskCount} open`;

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

  const hasRightAction = (!isArchived && onArchive) || (isArchived && (onUnarchive || onDelete));

  if (hasRightAction) {
    return (
      <ReanimatedSwipeable
        renderRightActions={(_progress, translation, swipeableMethods) => {
          if (isArchived) {
            return (
              <View style={styles.rightActions}>
                {onUnarchive && (
                  <SwipeAction
                    translation={translation}
                    icon={ArchiveRestore}
                    label="Unarchive"
                    bgColor="#2b6cb0"
                    onAction={onUnarchive}
                    swipeableMethods={swipeableMethods}
                  />
                )}
                {onDelete && (
                  <SwipeAction
                    translation={translation}
                    icon={Trash2}
                    label="Delete"
                    bgColor="#e53e3e"
                    onAction={onDelete}
                    swipeableMethods={swipeableMethods}
                  />
                )}
              </View>
            );
          }

          return (
            <SwipeAction
              translation={translation}
              icon={Archive}
              label="Archive"
              bgColor="#dd6b20"
              onAction={onArchive ?? (() => {})}
              swipeableMethods={swipeableMethods}
            />
          );
        }}
        overshootLeft={false}
        overshootRight={false}
      >
        {cardContent}
      </ReanimatedSwipeable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  rightActions: {
    flexDirection: "row",
  },
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
