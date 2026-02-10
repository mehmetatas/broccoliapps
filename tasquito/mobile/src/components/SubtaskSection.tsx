import { CharacterLimitIndicator, Modal, SpinningLoader, useModal, useTheme } from "@broccoliapps/mobile";
import { LIMITS, type TaskDto } from "@broccoliapps/tasquito-shared";
import { ChevronDown, ChevronRight, Circle, Trash2, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import { useTask } from "../hooks/useTask";
import { SubtaskItem } from "./SubtaskItem";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type SubtaskSectionProps = {
  task: TaskWithSubtasks;
  isArchived?: boolean;
  canAddSubtask?: boolean;
  addRequested?: boolean;
  onAddStarted?: () => void;
};

const sortBySortOrder = (a: TaskDto, b: TaskDto) => {
  const aOrder = a.sortOrder ?? "";
  const bOrder = b.sortOrder ?? "";
  return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
};

export const SubtaskSection = ({ task, isArchived, canAddSubtask: canAddSubtaskProp, addRequested, onAddStarted }: SubtaskSectionProps) => {
  const { colors } = useTheme();
  const { reorderSubtask, createSubtask, batchRemoveSubtasks } = useTask(task.id);
  const deleteDoneModal = useModal();

  const isDone = task.status === "done";
  const subtaskCount = task.subtasks.length;
  const canAddSubtask = canAddSubtaskProp ?? false;
  const canDragSubtasks = !isArchived && !isDone;

  const [doneExpanded, setDoneExpanded] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [pendingSubtaskTitle, setPendingSubtaskTitle] = useState<string | null>(null);
  const newSubtaskInputRef = useRef<TextInput>(null);
  const prevSubtaskCountRef = useRef(subtaskCount);

  const todoSubtasks = useMemo(() => [...task.subtasks].filter((s) => s.status === "todo").sort(sortBySortOrder), [task.subtasks]);
  const doneSubtasks = useMemo(() => [...task.subtasks].filter((s) => s.status === "done").sort(sortBySortOrder), [task.subtasks]);

  // Clear pending subtask when a new subtask is added
  useEffect(() => {
    if (subtaskCount > prevSubtaskCountRef.current && pendingSubtaskTitle) {
      setPendingSubtaskTitle(null);
    }
    prevSubtaskCountRef.current = subtaskCount;
  }, [subtaskCount, pendingSubtaskTitle]);

  // Allow parent (more menu) to trigger add-subtask
  useEffect(() => {
    if (addRequested && canAddSubtask && !isAddingSubtask) {
      setIsAddingSubtask(true);
      setNewSubtaskTitle("");
      onAddStarted?.();
      setTimeout(() => newSubtaskInputRef.current?.focus(), 50);
    }
  }, [addRequested, canAddSubtask, isAddingSubtask, onAddStarted]);

  // Auto-close add form when limit is reached
  useEffect(() => {
    if (isAddingSubtask && !canAddSubtask) {
      setIsAddingSubtask(false);
      setNewSubtaskTitle("");
    }
  }, [isAddingSubtask, canAddSubtask]);

  const handleAddSubtaskSubmit = useCallback(() => {
    const trimmed = newSubtaskTitle.trim();
    if (trimmed.length > LIMITS.MAX_SUBTASK_TITLE_LENGTH) {
      return;
    }
    setNewSubtaskTitle("");

    if (trimmed) {
      setPendingSubtaskTitle(trimmed);
      createSubtask(trimmed);
    }
  }, [newSubtaskTitle, createSubtask]);

  const handleAddSubtaskBlur = useCallback(() => {
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
  }, []);

  const handleSubtaskDragEnd = useCallback(
    ({ data, from, to }: { data: TaskDto[]; from: number; to: number }) => {
      if (from === to) {
        return;
      }
      const dragged = data[to];
      const after = to > 0 ? data[to - 1] : null;
      const before = to < data.length - 1 ? data[to + 1] : null;
      reorderSubtask(dragged.id, after?.id ?? null, before?.id ?? null);
    },
    [reorderSubtask],
  );

  const renderSubtaskItem = useCallback(
    ({ item: subtask, drag: subtaskDrag, isActive: isSubtaskActive }: RenderItemParams<TaskDto>) => (
      <SubtaskItem subtask={subtask} taskId={task.id} isArchived={isArchived} onDrag={canDragSubtasks ? subtaskDrag : undefined} isActive={isSubtaskActive} />
    ),
    [task.id, isArchived, canDragSubtasks],
  );

  if (subtaskCount === 0 && !isAddingSubtask && !pendingSubtaskTitle) {
    return null;
  }

  return (
    <View style={styles.subtasksSection}>
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
      {pendingSubtaskTitle && (
        <View style={styles.subtaskPreviewRow}>
          <SpinningLoader size={18} color={colors.textMuted} />
          <Text style={[styles.subtaskPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
            {pendingSubtaskTitle}
          </Text>
        </View>
      )}
      {isAddingSubtask && canAddSubtask && (
        <View>
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
              maxLength={Math.floor(LIMITS.MAX_SUBTASK_TITLE_LENGTH * 1.5)}
              autoFocus
            />
            <TouchableOpacity onPress={handleAddSubtaskBlur} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <CharacterLimitIndicator textLength={newSubtaskTitle.length} softLimit={LIMITS.MAX_SUBTASK_TITLE_LENGTH} />
        </View>
      )}
      {doneSubtasks.length > 0 && (
        <View>
          <View style={styles.doneHeader}>
            <TouchableOpacity onPress={() => setDoneExpanded((prev) => !prev)} style={styles.doneToggle} activeOpacity={0.7}>
              {doneExpanded ? <ChevronDown size={14} color={colors.textMuted} /> : <ChevronRight size={14} color={colors.textMuted} />}
              <Text style={[styles.doneToggleText, { color: colors.textMuted }]}>Done ({doneSubtasks.length})</Text>
            </TouchableOpacity>
            {doneExpanded && !isDone && (
              <TouchableOpacity onPress={() => deleteDoneModal.open()} style={styles.deleteAllButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 size={12} color={colors.textMuted} />
                <Text style={[styles.deleteAllText, { color: colors.textMuted }]}>Delete All</Text>
              </TouchableOpacity>
            )}
          </View>
          {doneExpanded && (
            <View style={styles.doneSubtasksContainer}>
              {doneSubtasks.map((subtask) => (
                <SubtaskItem key={subtask.id} subtask={subtask} taskId={task.id} isArchived={isArchived} />
              ))}
            </View>
          )}
        </View>
      )}

      <Modal
        visible={deleteDoneModal.isOpen}
        onClose={deleteDoneModal.close}
        title="Delete Done Subtasks"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          batchRemoveSubtasks(doneSubtasks.map((st) => st.id));
          deleteDoneModal.close();
        }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: "Nunito-Regular" }}>
          Are you sure you want to delete {doneSubtasks.length} done subtask{doneSubtasks.length !== 1 ? "s" : ""}? This action cannot be undone.
        </Text>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  subtasksSection: {
    gap: 4,
    marginTop: 4,
  },
  doneSubtasksContainer: {
    overflow: "hidden",
  },
  subtaskPreviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
  },
  subtaskPreviewText: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    flex: 1,
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
  doneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  doneToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  doneToggleText: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteAllText: {
    fontSize: 11,
    fontFamily: "Nunito-SemiBold",
  },
});
