import { useTheme } from "@broccoliapps/mobile";
import type { TaskDto } from "@broccoliapps/tasquito-shared";
import { Trash2 } from "lucide-react-native";
import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type Props = {
  task: TaskWithSubtasks;
  isArchived?: boolean;
  drag?: () => void;
  isActive?: boolean;
  onToggleStatus: () => void;
  onDelete: () => void;
};

export const TaskCard = ({ task, isArchived, drag, isActive, onToggleStatus, onDelete }: Props) => {
  const { colors } = useTheme();
  const isDone = task.status === "done";
  const subtaskCount = task.subtasks.length;
  const doneSubtaskCount = task.subtasks.filter((st) => st.status === "done").length;
  const swipeableRef = useRef<ReanimatedSwipeable>(null);

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete();
      }}
      activeOpacity={0.7}
    >
      <Trash2 size={18} color="#ffffff" />
    </TouchableOpacity>
  );

  const cardContent = (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
        isActive && styles.cardActive,
      ]}
      activeOpacity={0.7}
      disabled={isArchived}
      onLongPress={() => {
        ReactNativeHapticFeedback.trigger("impactMedium");
        drag?.();
      }}
      delayLongPress={150}
    >
      <TouchableOpacity
        style={[styles.checkbox, isDone ? styles.checkboxDone : { borderColor: colors.border, backgroundColor: "transparent" }]}
        onPress={onToggleStatus}
        disabled={isArchived}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isDone && <Text style={styles.checkmark}>{"\u2713"}</Text>}
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDone ? colors.textMuted : colors.textPrimary }, isDone && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        {subtaskCount > 0 && (
          <Text style={[styles.subtaskBadge, { color: colors.textMuted }]}>
            ({doneSubtaskCount}/{subtaskCount})
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isArchived) {
    return cardContent;
  }

  return (
    <ReanimatedSwipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} containerStyle={styles.swipeableOverflow}>
      {cardContent}
    </ReanimatedSwipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  cardActive: {
    transform: [{ rotate: "-2deg" }],
    opacity: 0.8,
  },
  swipeableOverflow: {
    overflow: "visible",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    borderColor: "#10b981",
    backgroundColor: "#10b981",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
    flexShrink: 1,
  },
  titleDone: {
    textDecorationLine: "line-through",
  },
  subtaskBadge: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
  },
  deleteAction: {
    backgroundColor: "#e53e3e",
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    marginBottom: 10,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});
