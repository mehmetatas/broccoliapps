import { SpinningLoader, SwipeAction, useTheme } from "@broccoliapps/mobile";
import { LIMITS, type TaskDto } from "@broccoliapps/tasquito-shared";
import { Circle, CircleCheck, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useSubtask } from "../hooks/useSubtask";

type SubtaskItemProps = {
  subtask: TaskDto;
  taskId: string;
  isArchived?: boolean;
  onDrag?: () => void;
  isActive?: boolean;
};

export const SubtaskItem = ({ subtask, taskId, isArchived, onDrag, isActive }: SubtaskItemProps) => {
  const { colors } = useTheme();
  const { toggle, updateTitle, remove } = useSubtask(taskId, subtask.id);

  const isDone = subtask.status === "done";
  const canEditTitle = !isArchived && !isDone;
  const canDrag = !isArchived && !isDone && !!onDrag;
  const canSwipeDelete = !isArchived && !isDone;

  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editingTitleRef = useRef<TextInput>(null);

  const handleTitlePress = useCallback(() => {
    if (!canEditTitle) {
      return;
    }
    setIsEditing(true);
    setEditingTitle(subtask.title);
    setTimeout(() => editingTitleRef.current?.focus(), 50);
  }, [canEditTitle, subtask.title]);

  const handleTitleSubmit = useCallback(async () => {
    if (!isEditing) {
      return;
    }
    const trimmed = editingTitle.trim();
    setIsEditing(false);
    setEditingTitle("");

    if (trimmed && trimmed !== subtask.title) {
      setIsSaving(true);
      try {
        await updateTitle(trimmed);
      } finally {
        setIsSaving(false);
      }
    }
  }, [isEditing, editingTitle, subtask.title, updateTitle]);

  const longPressHandler =
    canDrag && onDrag
      ? () => {
          ReactNativeHapticFeedback.trigger("impactMedium");
          onDrag();
        }
      : undefined;

  const content = (
    <View
      style={[
        styles.subtaskPreviewRow,
        isActive && { backgroundColor: colors.backgroundTertiary, borderRadius: 6, marginHorizontal: -4, paddingHorizontal: 4 },
      ]}
    >
      {isSaving ? (
        <View style={styles.subtaskIcon}>
          <SpinningLoader size={18} color={colors.textMuted} />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.subtaskIcon}
          onPress={(e) => {
            e.stopPropagation();
            toggle();
          }}
          onLongPress={longPressHandler}
          delayLongPress={150}
          disabled={isArchived}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isDone ? <CircleCheck size={18} color="#10b981" /> : <Circle size={18} color={colors.border} />}
        </TouchableOpacity>
      )}
      {isEditing ? (
        <TextInput
          ref={editingTitleRef}
          style={[styles.subtaskPreviewText, styles.subtaskTextInput, { color: colors.textSecondary }]}
          value={editingTitle}
          onChangeText={(text) => setEditingTitle(text.replace(/\n/g, " "))}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === "Enter") {
              e.preventDefault?.();
              handleTitleSubmit();
            }
          }}
          onBlur={handleTitleSubmit}
          multiline
          submitBehavior="blurAndSubmit"
          maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
          autoFocus
        />
      ) : (
        <TouchableOpacity
          style={styles.subtaskTextTouchable}
          onPress={handleTitlePress}
          onLongPress={longPressHandler}
          delayLongPress={150}
          activeOpacity={isDone ? 1 : canEditTitle ? 0.7 : 1}
        >
          <Text style={[styles.subtaskPreviewText, { color: isDone ? colors.textMuted : colors.textSecondary }, isDone && styles.subtaskPreviewTextDone]}>
            {subtask.title}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (canSwipeDelete) {
    return (
      <ReanimatedSwipeable
        renderRightActions={(_progress, translation, swipeableMethods) => (
          <SwipeAction
            translation={translation}
            icon={Trash2}
            bgColor="#e53e3e"
            onAction={remove}
            swipeableMethods={swipeableMethods}
            iconSize={14}
            width={40}
          />
        )}
        overshootRight={false}
        containerStyle={styles.subtaskSwipeableContainer}
      >
        {content}
      </ReanimatedSwipeable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  subtaskPreviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
  },
  subtaskIcon: {
    marginTop: 2,
  },
  subtaskPreviewText: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    flex: 1,
  },
  subtaskTextTouchable: {
    flex: 1,
  },
  subtaskTextInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  subtaskPreviewTextDone: {
    textDecorationLine: "line-through",
  },
  subtaskSwipeableContainer: {
    overflow: "visible",
  },
});
