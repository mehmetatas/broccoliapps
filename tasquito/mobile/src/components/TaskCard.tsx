import { useTheme } from "@broccoliapps/mobile";
import { LIMITS, type TaskDto } from "@broccoliapps/tasquito-shared";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Check, Circle, CircleCheck, Loader2, MoreHorizontal, Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type Props = {
  task: TaskWithSubtasks;
  isArchived?: boolean;
  drag?: () => void;
  isActive?: boolean;
  onToggleStatus: () => void;
  onDelete: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onReorderSubtask?: (subtaskId: string, afterId: string | null, beforeId: string | null) => void;
  onUpdateSubtaskTitle?: (subtaskId: string, title: string) => Promise<void>;
  onUpdateTaskTitle?: (title: string) => Promise<void>;
  onDeleteSubtask?: (subtaskId: string) => void;
  onDueDateChange?: (date: string | undefined) => void;
  onCreateSubtask?: (title: string) => void;
  onUpdateDescription?: (description: string) => Promise<void>;
};

const SwipeDeleteAction = ({
  translation,
  onAction,
  swipeableMethods,
  showText = true,
  iconSize = 20,
  width = 80,
}: {
  translation: SharedValue<number>;
  onAction: () => void;
  swipeableMethods: SwipeableMethods;
  showText?: boolean;
  iconSize?: number;
  width?: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translation.value, [-width, 0], [0, width], "clamp") }],
  }));

  return (
    <Animated.View style={[styles.swipeAction, { width }, animatedStyle]}>
      <TouchableOpacity
        style={styles.swipeButton}
        onPress={() => {
          swipeableMethods.close();
          onAction();
        }}
        activeOpacity={0.7}
      >
        <Trash2 size={iconSize} color="#ffffff" />
        {showText && <Text style={styles.swipeText}>Delete</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

const SpinningLoader = ({ size, color }: { size: number; color: string }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
};

const sortBySortOrder = (a: TaskDto, b: TaskDto) => {
  const aOrder = a.sortOrder ?? "";
  const bOrder = b.sortOrder ?? "";
  return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
};

const formatDueDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const TaskCard = ({
  task,
  isArchived,
  drag,
  isActive,
  onToggleStatus,
  onDelete,
  onToggleSubtask,
  onReorderSubtask,
  onUpdateSubtaskTitle,
  onUpdateTaskTitle,
  onDeleteSubtask,
  onDueDateChange,
  onCreateSubtask,
  onUpdateDescription,
}: Props) => {
  const { colors } = useTheme();
  const isDone = task.status === "done";
  const subtaskCount = task.subtasks.length;

  // Inline task title editing state
  const [isEditingTaskTitle, setIsEditingTaskTitle] = useState(false);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [isSavingTaskTitle, setIsSavingTaskTitle] = useState(false);
  const taskTitleInputRef = useRef<TextInput>(null);

  // Inline subtask editing state
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingSubtaskId, setSavingSubtaskId] = useState<string | null>(null);
  const editingTitleRef = useRef<TextInput>(null);

  // New subtask input state
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [pendingSubtaskTitle, setPendingSubtaskTitle] = useState<string | null>(null);
  const newSubtaskInputRef = useRef<TextInput>(null);
  const prevSubtaskCountRef = useRef(subtaskCount);

  // Description editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDescription, setEditingDescription] = useState("");
  const [_isSavingDescription, setIsSavingDescription] = useState(false);
  const descriptionInputRef = useRef<TextInput>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<string | undefined>(undefined);

  // Can edit due date only when: not archived, task not done, and handler is provided
  const canEditDueDate = !isArchived && !isDone && !!onDueDateChange;

  // Can edit description only when: not archived, task not done, and handler is provided
  const canEditDescription = !isArchived && !isDone && !!onUpdateDescription;

  // Can add subtask only when: not archived, task not done, handler is provided, and below limit
  const canAddSubtask = !isArchived && !isDone && !!onCreateSubtask && subtaskCount < LIMITS.MAX_SUBTASKS_PER_TASK;

  // Show "more" menu when task can have date/description/subtask added
  const canShowMoreMenu = (!task.dueDate && canEditDueDate) || (!task.description && canEditDescription) || canAddSubtask;

  // Clear pending subtask when a new subtask is added to the list
  useEffect(() => {
    if (subtaskCount > prevSubtaskCountRef.current && pendingSubtaskTitle) {
      setPendingSubtaskTitle(null);
    }
    prevSubtaskCountRef.current = subtaskCount;
  }, [subtaskCount, pendingSubtaskTitle]);

  const handleDescriptionPress = useCallback(() => {
    if (!canEditDescription) {
      return;
    }
    setIsEditingDescription(true);
    setEditingDescription(task.description ?? "");
    setTimeout(() => descriptionInputRef.current?.focus(), 50);
  }, [canEditDescription, task.description]);

  const handleDescriptionSubmit = useCallback(async () => {
    if (!isEditingDescription) {
      return;
    }
    const trimmed = editingDescription.trim();
    setIsEditingDescription(false);
    setEditingDescription("");

    if (trimmed !== (task.description ?? "")) {
      setIsSavingDescription(true);
      try {
        await onUpdateDescription?.(trimmed);
      } finally {
        setIsSavingDescription(false);
      }
    }
  }, [isEditingDescription, editingDescription, task.description, onUpdateDescription]);

  const handleDescriptionDiscard = useCallback(() => {
    setIsEditingDescription(false);
    setEditingDescription("");
  }, []);

  const handleDueDatePress = useCallback(() => {
    if (!canEditDueDate) {
      return;
    }
    if (Platform.OS === "android") {
      // On Android, show an alert with options since native picker doesn't support clearing
      Alert.alert("Due Date", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove Date", style: "destructive", onPress: () => onDueDateChange?.(undefined) },
        {
          text: "Change Date",
          onPress: () => {
            setTempDate(task.dueDate ?? undefined);
            setShowDatePicker(true);
          },
        },
      ]);
    } else {
      // Initialize to task's due date, or today if none (fallback)
      setTempDate(task.dueDate ?? new Date().toISOString().split("T")[0]);
      setShowDatePicker(true);
    }
  }, [canEditDueDate, task.dueDate, onDueDateChange]);

  const handleDateChange = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const formatted = date.toISOString().split("T")[0];
        setTempDate(formatted);
        if (Platform.OS === "android") {
          setShowDatePicker(false);
          onDueDateChange?.(formatted);
        }
      }
    },
    [onDueDateChange],
  );

  const handleDatePickerDone = useCallback(() => {
    setShowDatePicker(false);
    // Always apply the date - use tempDate or fall back to picker's displayed value (today)
    const selectedDate = tempDate ?? new Date().toISOString().split("T")[0];
    onDueDateChange?.(selectedDate);
  }, [tempDate, onDueDateChange]);

  const handleClearDate = useCallback(() => {
    setShowDatePicker(false);
    onDueDateChange?.(undefined);
  }, [onDueDateChange]);

  const handleAddSubtaskPress = useCallback(() => {
    if (!canAddSubtask) {
      return;
    }
    if (isAddingSubtask) {
      // Toggle off: dismiss keyboard and discard
      Keyboard.dismiss();
      setIsAddingSubtask(false);
      setNewSubtaskTitle("");
    } else {
      // Toggle on: show input and focus
      setIsAddingSubtask(true);
      setNewSubtaskTitle("");
      setTimeout(() => newSubtaskInputRef.current?.focus(), 50);
    }
  }, [canAddSubtask, isAddingSubtask]);

  const handleMoreMenuPress = useCallback(() => {
    const options: { text: string; onPress?: () => void; style?: "cancel" | "destructive" | "default" }[] = [];
    if (canAddSubtask) {
      options.push({ text: "Add Subtask", onPress: () => handleAddSubtaskPress() });
    }
    if (!task.dueDate && canEditDueDate) {
      options.push({ text: "Add Due Date", onPress: () => handleDueDatePress() });
    }
    if (!task.description && canEditDescription) {
      options.push({ text: "Add Description", onPress: () => handleDescriptionPress() });
    }
    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert("", "", options);
  }, [task.dueDate, task.description, canAddSubtask, canEditDueDate, canEditDescription, handleAddSubtaskPress, handleDueDatePress, handleDescriptionPress]);

  // Split subtasks: todo (draggable) and done (static, below)
  const todoSubtasks = useMemo(() => [...task.subtasks].filter((s) => s.status === "todo").sort(sortBySortOrder), [task.subtasks]);
  const doneSubtasks = useMemo(() => [...task.subtasks].filter((s) => s.status === "done").sort(sortBySortOrder), [task.subtasks]);

  // Drag is enabled for subtasks only when: not archived, task not done, and handler is provided
  const canDragSubtasks = !isArchived && !isDone && !!onReorderSubtask;

  // Swipe delete is enabled for subtasks only when: not archived, task not done, and handler is provided
  const canSwipeDeleteSubtask = !isArchived && !isDone && !!onDeleteSubtask;

  // Can edit task title only when: not archived, task not done, and handler is provided
  const canEditTaskTitle = !isArchived && !isDone && !!onUpdateTaskTitle;

  const handleAddSubtaskSubmit = useCallback(() => {
    const trimmed = newSubtaskTitle.trim();
    setNewSubtaskTitle("");

    if (trimmed) {
      setPendingSubtaskTitle(trimmed);
      onCreateSubtask?.(trimmed);
    }
    // Keep input open and focused for quick multi-add
  }, [newSubtaskTitle, onCreateSubtask]);

  const handleAddSubtaskBlur = useCallback(() => {
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
  }, []);

  const handleTaskTitlePress = useCallback(() => {
    if (!canEditTaskTitle) {
      return;
    }
    setIsEditingTaskTitle(true);
    setEditingTaskTitle(task.title);
    setTimeout(() => taskTitleInputRef.current?.focus(), 50);
  }, [canEditTaskTitle, task.title]);

  const handleTaskTitleSubmit = useCallback(async () => {
    if (!isEditingTaskTitle) {
      return;
    }
    const trimmed = editingTaskTitle.trim();
    setIsEditingTaskTitle(false);
    setEditingTaskTitle("");

    if (trimmed && trimmed !== task.title) {
      setIsSavingTaskTitle(true);
      try {
        await onUpdateTaskTitle?.(trimmed);
      } finally {
        setIsSavingTaskTitle(false);
      }
    }
  }, [isEditingTaskTitle, editingTaskTitle, task.title, onUpdateTaskTitle]);

  const handleSubtaskDragEnd = useCallback(
    ({ data, from, to }: { data: TaskDto[]; from: number; to: number }) => {
      if (from === to) {
        return;
      }
      const dragged = data[to];
      const after = to > 0 ? data[to - 1] : null;
      const before = to < data.length - 1 ? data[to + 1] : null;
      onReorderSubtask?.(dragged.id, after?.id ?? null, before?.id ?? null);
    },
    [onReorderSubtask],
  );

  // Can edit subtask title only when: not archived, task not done, subtask not done, and handler is provided
  const canEditSubtaskTitle = !isArchived && !isDone && !!onUpdateSubtaskTitle;

  const handleSubtaskTitlePress = useCallback(
    (subtask: TaskDto) => {
      if (!canEditSubtaskTitle || subtask.status === "done") {
        return;
      }
      setEditingSubtaskId(subtask.id);
      setEditingTitle(subtask.title);
      setTimeout(() => editingTitleRef.current?.focus(), 50);
    },
    [canEditSubtaskTitle],
  );

  const handleSubtaskTitleSubmit = useCallback(async () => {
    if (!editingSubtaskId) {
      return;
    }
    const trimmed = editingTitle.trim();
    const subtaskIdToSave = editingSubtaskId;
    setEditingSubtaskId(null);
    setEditingTitle("");

    if (trimmed && trimmed !== task.subtasks.find((s) => s.id === subtaskIdToSave)?.title) {
      setSavingSubtaskId(subtaskIdToSave);
      try {
        await onUpdateSubtaskTitle?.(subtaskIdToSave, trimmed);
      } finally {
        setSavingSubtaskId(null);
      }
    }
  }, [editingSubtaskId, editingTitle, task.subtasks, onUpdateSubtaskTitle]);

  const renderSubtaskItem = useCallback(
    ({ item: subtask, drag: subtaskDrag, isActive: isSubtaskActive }: RenderItemParams<TaskDto>) => {
      const isEditing = editingSubtaskId === subtask.id;
      const isSaving = savingSubtaskId === subtask.id;

      const subtaskContent = (
        <View
          style={[
            styles.subtaskPreviewRow,
            isSubtaskActive && { backgroundColor: colors.backgroundTertiary, borderRadius: 6, marginHorizontal: -4, paddingHorizontal: 4 },
          ]}
        >
          {isSaving ? (
            <SpinningLoader size={18} color={colors.textMuted} />
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggleSubtask?.(subtask.id);
              }}
              onLongPress={
                canDragSubtasks
                  ? () => {
                      ReactNativeHapticFeedback.trigger("impactMedium");
                      subtaskDrag();
                    }
                  : undefined
              }
              delayLongPress={150}
              disabled={isArchived || isDone}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Circle size={18} color={colors.border} />
            </TouchableOpacity>
          )}
          {isEditing ? (
            <TextInput
              ref={editingTitleRef}
              style={[styles.subtaskPreviewText, styles.subtaskTextInput, { color: colors.textSecondary }]}
              value={editingTitle}
              onChangeText={setEditingTitle}
              onSubmitEditing={handleSubtaskTitleSubmit}
              onBlur={handleSubtaskTitleSubmit}
              returnKeyType="done"
              maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
              autoFocus
            />
          ) : (
            <TouchableOpacity
              style={styles.subtaskTextTouchable}
              onPress={() => handleSubtaskTitlePress(subtask)}
              onLongPress={
                canDragSubtasks
                  ? () => {
                      ReactNativeHapticFeedback.trigger("impactMedium");
                      subtaskDrag();
                    }
                  : undefined
              }
              delayLongPress={150}
              activeOpacity={canEditSubtaskTitle ? 0.7 : 1}
            >
              <Text style={[styles.subtaskPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                {subtask.title}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );

      // Wrap in swipeable when delete is enabled
      if (canSwipeDeleteSubtask) {
        return (
          <ReanimatedSwipeable
            renderRightActions={(_progress, translation, swipeableMethods) => (
              <SwipeDeleteAction
                translation={translation}
                onAction={() => onDeleteSubtask?.(subtask.id)}
                swipeableMethods={swipeableMethods}
                showText={false}
                iconSize={14}
                width={40}
              />
            )}
            overshootRight={false}
            containerStyle={styles.subtaskSwipeableContainer}
          >
            {subtaskContent}
          </ReanimatedSwipeable>
        );
      }

      return subtaskContent;
    },
    [
      colors.border,
      colors.textMuted,
      colors.textSecondary,
      colors.backgroundTertiary,
      isArchived,
      isDone,
      onToggleSubtask,
      canDragSubtasks,
      canEditSubtaskTitle,
      canSwipeDeleteSubtask,
      onDeleteSubtask,
      editingSubtaskId,
      editingTitle,
      savingSubtaskId,
      handleSubtaskTitlePress,
      handleSubtaskTitleSubmit,
    ],
  );

  const renderDoneSubtaskItem = useCallback(
    (subtask: TaskDto) => {
      const isEditing = editingSubtaskId === subtask.id;
      const isSaving = savingSubtaskId === subtask.id;

      const subtaskContent = (
        <View style={styles.subtaskPreviewRow}>
          {isSaving ? (
            <SpinningLoader size={18} color={colors.textMuted} />
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggleSubtask?.(subtask.id);
              }}
              disabled={isArchived || isDone}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <CircleCheck size={18} color="#10b981" />
            </TouchableOpacity>
          )}
          {isEditing ? (
            <TextInput
              ref={editingTitleRef}
              style={[styles.subtaskPreviewText, styles.subtaskTextInput, { color: colors.textSecondary }]}
              value={editingTitle}
              onChangeText={setEditingTitle}
              onSubmitEditing={handleSubtaskTitleSubmit}
              onBlur={handleSubtaskTitleSubmit}
              returnKeyType="done"
              maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
              autoFocus
            />
          ) : (
            <TouchableOpacity style={styles.subtaskTextTouchable} onPress={() => handleSubtaskTitlePress(subtask)} activeOpacity={1}>
              <Text style={[styles.subtaskPreviewText, { color: colors.textMuted }, styles.subtaskPreviewTextDone]} numberOfLines={1}>
                {subtask.title}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );

      // Wrap in swipeable when delete is enabled
      if (canSwipeDeleteSubtask) {
        return (
          <ReanimatedSwipeable
            key={subtask.id}
            renderRightActions={(_progress, translation, swipeableMethods) => (
              <SwipeDeleteAction
                translation={translation}
                onAction={() => onDeleteSubtask?.(subtask.id)}
                swipeableMethods={swipeableMethods}
                showText={false}
                iconSize={14}
                width={40}
              />
            )}
            overshootRight={false}
            containerStyle={styles.subtaskSwipeableContainer}
          >
            {subtaskContent}
          </ReanimatedSwipeable>
        );
      }

      return <View key={subtask.id}>{subtaskContent}</View>;
    },
    [
      colors.textMuted,
      colors.textSecondary,
      isArchived,
      isDone,
      onToggleSubtask,
      canSwipeDeleteSubtask,
      onDeleteSubtask,
      editingSubtaskId,
      editingTitle,
      savingSubtaskId,
      handleSubtaskTitlePress,
      handleSubtaskTitleSubmit,
    ],
  );

  const cardContent = (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderBottomColor: colors.divider,
        },
        isActive && styles.cardActive,
      ]}
      activeOpacity={1}
      onLongPress={() => {
        ReactNativeHapticFeedback.trigger("impactMedium");
        drag?.();
      }}
      delayLongPress={150}
    >
      {isSavingTaskTitle ? (
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
          {isDone ? <CircleCheck size={24} color="#10b981" /> : <Circle size={24} color={colors.border} />}
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          {/* Title + Date inline */}
          <View style={styles.titleWithDate}>
            {isEditingTaskTitle ? (
              <TextInput
                ref={taskTitleInputRef}
                style={[styles.title, styles.titleInput, { color: colors.textPrimary }]}
                value={editingTaskTitle}
                onChangeText={setEditingTaskTitle}
                onSubmitEditing={handleTaskTitleSubmit}
                onBlur={handleTaskTitleSubmit}
                returnKeyType="done"
                maxLength={LIMITS.MAX_TASK_TITLE_LENGTH}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={handleTaskTitlePress} activeOpacity={canEditTaskTitle ? 0.7 : 1} style={styles.titleTouchable}>
                <Text style={[styles.title, { color: isDone ? colors.textMuted : colors.textPrimary }, isDone && styles.titleDone]} numberOfLines={2}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            )}
            {task.dueDate && (
              <TouchableOpacity
                style={styles.dueDateBadge}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDueDatePress();
                }}
                activeOpacity={canEditDueDate ? 0.7 : 1}
                disabled={!canEditDueDate}
              >
                <Text style={styles.dueDateText}>{formatDueDate(task.dueDate)}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Top-right more menu */}
          {canShowMoreMenu && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleMoreMenuPress();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MoreHorizontal size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {/* Subtasks section */}
        {(subtaskCount > 0 || isAddingSubtask || pendingSubtaskTitle) && (
          <View style={styles.subtasksSection}>
            {/* Todo subtasks (draggable) */}
            {todoSubtasks.length > 0 && (
              <DraggableFlatList<TaskDto>
                data={todoSubtasks}
                extraData={todoSubtasks.map((s) => s.id).join(",")}
                keyExtractor={(item) => item.id}
                renderItem={renderSubtaskItem}
                onDragEnd={handleSubtaskDragEnd}
                scrollEnabled={false}
              />
            )}
            {/* Pending subtask with spinner - at bottom of todo list */}
            {pendingSubtaskTitle && (
              <View style={styles.subtaskPreviewRow}>
                <SpinningLoader size={18} color={colors.textMuted} />
                <Text style={[styles.subtaskPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {pendingSubtaskTitle}
                </Text>
              </View>
            )}
            {/* Add subtask input - after todo, before done */}
            {isAddingSubtask && canAddSubtask && (
              <View style={styles.addSubtaskRow}>
                <Circle size={18} color={colors.border} />
                <TextInput
                  ref={newSubtaskInputRef}
                  style={[styles.addSubtaskInput, { color: colors.textSecondary }]}
                  value={newSubtaskTitle}
                  onChangeText={setNewSubtaskTitle}
                  onSubmitEditing={handleAddSubtaskSubmit}
                  placeholder="Add subtask"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  submitBehavior="submit"
                  maxLength={LIMITS.MAX_SUBTASK_TITLE_LENGTH}
                  autoFocus
                />
                <TouchableOpacity onPress={handleAddSubtaskBlur} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            {/* Done subtasks (static) */}
            {doneSubtasks.length > 0 && <View style={styles.doneSubtasksContainer}>{doneSubtasks.map((subtask) => renderDoneSubtaskItem(subtask))}</View>}
          </View>
        )}
        {/* Description */}
        {(task.description || isEditingDescription) &&
          (isEditingDescription ? (
            <View style={styles.descriptionEditContainer}>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.descriptionInput, { color: colors.textMuted }]}
                value={editingDescription}
                onChangeText={setEditingDescription}
                placeholder="Add description"
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                scrollEnabled={false}
                maxLength={LIMITS.MAX_TASK_DESCRIPTION_LENGTH}
                autoFocus
              />
              <View style={styles.descriptionActions}>
                <TouchableOpacity onPress={handleDescriptionDiscard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDescriptionSubmit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Check size={18} color={colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleDescriptionPress} activeOpacity={canEditDescription ? 0.7 : 1}>
              <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={3}>
                {task.description}
              </Text>
            </TouchableOpacity>
          ))}
      </View>
    </TouchableOpacity>
  );

  const datePickerModal = (
    <>
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={tempDate ? new Date(tempDate) : new Date()}
          mode="date"
          onChange={(_event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              handleDateChange(selectedDate);
            }
          }}
        />
      )}
      {showDatePicker && Platform.OS === "ios" && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.datePickerModalOverlay}>
            <Pressable style={styles.datePickerModalBackdrop} onPress={() => setShowDatePicker(false)} />
            <Animated.View
              style={[styles.datePickerModalContent, { backgroundColor: colors.background }]}
              entering={SlideInDown.duration(300)}
              exiting={SlideOutDown.duration(200)}
            >
              <View style={[styles.datePickerModalHeader, { borderBottomColor: colors.divider }]}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={8}>
                  <Text style={[styles.datePickerModalCancel, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearDate} hitSlop={8}>
                  <Text style={styles.datePickerModalClear}>Clear date</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDatePickerDone} hitSlop={8}>
                  <Text style={[styles.datePickerModalDone, { color: colors.accent }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate ? new Date(tempDate) : new Date()}
                mode="date"
                display="spinner"
                onChange={(_event, selectedDate) => {
                  if (selectedDate) {
                    handleDateChange(selectedDate);
                  }
                }}
                style={styles.datePickerSpinner}
              />
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );

  if (isArchived) {
    return (
      <>
        {cardContent}
        {datePickerModal}
      </>
    );
  }

  return (
    <>
      <ReanimatedSwipeable
        renderRightActions={(_progress, translation, swipeableMethods) => (
          <SwipeDeleteAction translation={translation} onAction={onDelete} swipeableMethods={swipeableMethods} />
        )}
        overshootRight={false}
        containerStyle={styles.swipeableOverflow}
      >
        {cardContent}
      </ReanimatedSwipeable>
      {datePickerModal}
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
  subtaskSwipeableContainer: {
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
    alignItems: "center",
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
  description: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    lineHeight: 20,
  },
  descriptionEditContainer: {
    gap: 8,
  },
  descriptionInput: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    lineHeight: 20,
    padding: 0,
    margin: 0,
  },
  descriptionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  subtasksSection: {
    gap: 4,
    marginTop: 4,
  },
  doneSubtasksContainer: {
    overflow: "hidden",
  },
  subtaskPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
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
  swipeAction: {
    width: 80,
    marginBottom: 0,
  },
  swipeButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#e53e3e",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  swipeText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  datePickerModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  datePickerModalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  datePickerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerModalCancel: {
    fontSize: 18,
    fontFamily: "Nunito-Regular",
  },
  datePickerModalClear: {
    fontSize: 18,
    fontFamily: "Nunito-Regular",
    color: "#e53e3e",
  },
  datePickerModalDone: {
    fontSize: 18,
    fontFamily: "Nunito-SemiBold",
  },
  datePickerSpinner: {
    height: 200,
  },
  addSubtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  addSubtaskInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    padding: 0,
    margin: 0,
  },
});
