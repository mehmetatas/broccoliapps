import { BottomModal, DatePickerModal, SpinningLoader, SwipeAction, useTheme } from "@broccoliapps/mobile";
import { LIMITS, type TaskDto } from "@broccoliapps/tasquito-shared";
import { Circle, CircleCheck, MoreHorizontal, Trash2 } from "lucide-react-native";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useTask } from "../hooks/useTask";
import { useTaskCardState } from "../hooks/useTaskCardState";
import { SubtaskSection } from "./SubtaskSection";
import { TaskNote } from "./TaskNote";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type Props = {
  task: TaskWithSubtasks;
  isArchived?: boolean;
  drag?: () => void;
  isActive?: boolean;
  onToggleStatus: () => void;
};

const formatDueDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const TaskCard = ({ task, isArchived, drag, isActive, onToggleStatus }: Props) => {
  const { colors } = useTheme();
  const { remove, updateTitle, updateDueDate } = useTask(task.id);
  const state = useTaskCardState({
    task,
    isArchived,
    updateTitle,
    updateDueDate,
  });

  const cardContent = (
    <TouchableOpacity
      style={[styles.card, { borderBottomColor: colors.divider }, isActive && styles.cardActive]}
      activeOpacity={1}
      onLongPress={() => {
        ReactNativeHapticFeedback.trigger("impactMedium");
        drag?.();
      }}
      delayLongPress={150}
    >
      {state.isSavingTaskTitle ? (
        <View style={styles.checkboxButton}>
          <SpinningLoader size={24} color={colors.textMuted} />
        </View>
      ) : (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggleStatus();
          }}
          disabled={isArchived}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.checkboxButton}
        >
          {state.isDone ? <CircleCheck size={24} color="#10b981" /> : <Circle size={24} color={colors.border} />}
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleWithDate}>
            {state.isEditingTaskTitle ? (
              <TextInput
                ref={state.taskTitleInputRef}
                style={[styles.title, styles.titleInput, { color: colors.textPrimary }]}
                value={state.editingTaskTitle}
                onChangeText={(text) => state.setEditingTaskTitle(text.replace(/\n/g, " "))}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === "Enter") {
                    e.preventDefault?.();
                    state.handleTaskTitleSubmit();
                  }
                }}
                onBlur={state.handleTaskTitleSubmit}
                multiline
                submitBehavior="blurAndSubmit"
                maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={state.handleTaskTitlePress} activeOpacity={state.canEditTaskTitle ? 0.7 : 1} style={styles.titleTouchable}>
                <Text style={[styles.title, { color: state.isDone ? colors.textMuted : colors.textPrimary }, state.isDone && styles.titleDone]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            )}
            {task.dueDate && (
              <TouchableOpacity
                style={styles.dueDateBadge}
                onPress={(e) => {
                  e.stopPropagation();
                  state.handleDueDatePress();
                }}
                activeOpacity={state.canEditDueDate ? 0.7 : 1}
                disabled={!state.canEditDueDate}
              >
                <Text style={styles.dueDateText}>{formatDueDate(task.dueDate)}</Text>
              </TouchableOpacity>
            )}
          </View>

          {state.canShowMoreMenu && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                state.handleMoreMenuPress();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MoreHorizontal size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <SubtaskSection task={task} isArchived={isArchived} addRequested={state.subtaskAddRequested} onAddStarted={state.handleSubtaskAddStarted} />

        <TaskNote
          taskId={task.id}
          note={task.note}
          isArchived={isArchived}
          isDone={state.isDone}
          editRequested={state.noteEditRequested}
          onEditStarted={state.handleNoteEditStarted}
        />
      </View>
    </TouchableOpacity>
  );

  const datePickerModal = (
    <DatePickerModal
      visible={state.showDatePicker}
      initialDate={state.datePickerInitialDate}
      onDateSelect={state.handleDateSelect}
      onClearDate={state.handleClearDate}
      onClose={state.handleDatePickerClose}
    />
  );

  const moreMenuModal = (
    <BottomModal visible={state.showMoreMenu} onClose={state.handleMoreMenuClose}>
      <View style={styles.menuContainer}>
        {state.canAddSubtask && (
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={state.handleAddSubtaskFromMenu} activeOpacity={0.6}>
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Add Subtask</Text>
          </TouchableOpacity>
        )}
        {!task.dueDate && state.canEditDueDate && (
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.divider }]}
            onPress={() => {
              state.handleMoreMenuClose();
              state.handleDueDatePress();
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Add Due Date</Text>
          </TouchableOpacity>
        )}
        {!task.note && state.canEditNote && (
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={state.handleAddNoteFromMenu} activeOpacity={0.6}>
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Add Note</Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomModal>
  );

  const dueDateMenuModal = (
    <BottomModal visible={state.showDueDateMenu} onClose={state.handleDueDateMenuClose}>
      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={state.handleDueDateMenuChange} activeOpacity={0.6}>
          <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Change Date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.divider }]} onPress={state.handleDueDateMenuRemove} activeOpacity={0.6}>
          <Text style={[styles.menuItemText, styles.menuItemTextDestructive]}>Remove Date</Text>
        </TouchableOpacity>
      </View>
    </BottomModal>
  );

  if (isArchived) {
    return (
      <>
        {cardContent}
        {datePickerModal}
        {moreMenuModal}
        {dueDateMenuModal}
      </>
    );
  }

  return (
    <>
      <ReanimatedSwipeable
        renderRightActions={(_progress, translation, swipeableMethods) => (
          <SwipeAction translation={translation} icon={Trash2} label="Delete" bgColor="#e53e3e" onAction={remove} swipeableMethods={swipeableMethods} />
        )}
        overshootRight={false}
        containerStyle={styles.swipeableOverflow}
      >
        {cardContent}
      </ReanimatedSwipeable>
      {datePickerModal}
      {moreMenuModal}
      {dueDateMenuModal}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 0,
    gap: 12,
  },
  cardActive: {
    transform: [{ rotate: "-2deg" }],
    opacity: 0.8,
  },
  swipeableOverflow: {
    overflow: "visible",
  },
  checkboxButton: {
    marginTop: 1,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  titleWithDate: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  dueDateBadge: {
    backgroundColor: "#3b82f6",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dueDateText: {
    fontSize: 13,
    fontFamily: "Nunito-SemiBold",
    color: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontFamily: "Nunito-SemiBold",
    flexShrink: 1,
  },
  titleTouchable: {
    flexShrink: 1,
  },
  titleInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  titleDone: {
    textDecorationLine: "line-through",
  },
  menuContainer: {
    paddingBottom: 16,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 17,
    fontFamily: "Nunito-Regular",
  },
  menuItemTextDestructive: {
    color: "#e53e3e",
  },
});
