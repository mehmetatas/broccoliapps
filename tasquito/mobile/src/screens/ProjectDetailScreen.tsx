import { useTheme } from "@broccoliapps/mobile";
import type { TaskDto } from "@broccoliapps/tasquito-shared";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { useProject } from "@broccoliapps/tasquito-shared/hooks";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Archive, ArchiveRestore, ChevronLeft, Trash2 } from "lucide-react-native";
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import { TaskCard } from "../components/TaskCard";
import { TaskCardSkeleton, TaskListSkeleton } from "../components/TaskCardSkeleton";
import { TaskForm, type TaskFormData } from "../components/TaskForm";
import type { RootStackParamList } from "../navigation/types";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

type AnimatedCellProps = {
  exiting: boolean;
  onExitDone: () => void;
  children: ReactElement;
};

const AnimatedCell = ({ exiting, onExitDone, children }: AnimatedCellProps) => {
  const progress = useRef(new Animated.Value(1)).current;
  const measuredHeight = useRef(0);
  const [collapsing, setCollapsing] = useState(false);

  useEffect(() => {
    if (exiting && !collapsing) {
      setCollapsing(true);
      Animated.timing(progress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onExitDone();
        }
      });
    } else if (!exiting && collapsing) {
      // Reset when no longer exiting (task reappears after status change)
      setCollapsing(false);
      progress.setValue(1);
    }
  }, [exiting, collapsing, progress, onExitDone]);

  return (
    <Animated.View
      onLayout={(e) => {
        if (!collapsing) {
          measuredHeight.current = e.nativeEvent.layout.height;
        }
      }}
      style={
        collapsing
          ? {
              height: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, measuredHeight.current],
              }),
              opacity: progress,
              overflow: "hidden" as const,
            }
          : undefined
      }
    >
      {children}
    </Animated.View>
  );
};

export const ProjectDetailScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  const { colors } = useTheme();
  const [exitingTaskId, setExitingTaskId] = useState<string | null>(null);
  const pendingToggle = useRef<{ taskId: string; newStatus: "todo" | "done" } | null>(null);

  const {
    project,
    tasks,
    isLoading,
    error,
    limitError,
    clearLimitError,
    pendingTaskCount,
    createTask,
    updateTaskStatus,
    updateTaskTitle,
    updateTaskNote,
    updateTaskDueDate,
    updateSubtaskStatus,
    updateSubtaskTitle,
    removeSubtask,
    createSubtask,
    reorderSubtask,
    removeTask,
    updateName,
    reorderTask,
    archive,
    unarchive,
    remove,
    refresh,
  } = useProject(projectId);

  const isArchived = project?.isArchived ?? false;
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  const handleToggleSubtaskOnCard = useCallback(
    (taskId: string, subtaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        return;
      }
      const subtask = task.subtasks.find((st) => st.id === subtaskId);
      if (!subtask) {
        return;
      }
      const newStatus = subtask.status === "todo" ? "done" : "todo";
      updateSubtaskStatus(taskId, subtaskId, newStatus);
    },
    [tasks, updateSubtaskStatus],
  );

  const handleReorderSubtaskOnCard = useCallback(
    (taskId: string, subtaskId: string, afterId: string | null, beforeId: string | null) => {
      reorderSubtask(taskId, subtaskId, afterId, beforeId);
    },
    [reorderSubtask],
  );

  const handleUpdateSubtaskTitleOnCard = useCallback(
    (taskId: string, subtaskId: string, title: string) => {
      return updateSubtaskTitle(taskId, subtaskId, title);
    },
    [updateSubtaskTitle],
  );

  const handleUpdateTaskTitleOnCard = useCallback(
    (taskId: string, title: string) => {
      return updateTaskTitle(taskId, title);
    },
    [updateTaskTitle],
  );

  const handleDeleteSubtaskOnCard = useCallback(
    (taskId: string, subtaskId: string) => {
      removeSubtask(taskId, subtaskId);
    },
    [removeSubtask],
  );

  const handleDueDateChangeOnCard = useCallback(
    (taskId: string, date: string | undefined) => {
      updateTaskDueDate(taskId, date);
    },
    [updateTaskDueDate],
  );

  const handleCreateSubtaskOnCard = useCallback(
    (taskId: string, title: string) => {
      createSubtask(taskId, title);
    },
    [createSubtask],
  );

  const handleUpdateNoteOnCard = useCallback(
    (taskId: string, note: string) => {
      return updateTaskNote(taskId, note);
    },
    [updateTaskNote],
  );

  const handleCreateTask = useCallback(
    (data: TaskFormData) => {
      createTask(data);
    },
    [createTask],
  );

  const handleNamePress = () => {
    if (isArchived) {
      return;
    }
    setEditedName(project?.name ?? "");
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== project?.name) {
      updateName(trimmed);
    }
  };

  const todoTasks = useMemo(() => tasks.filter((t) => t.status === "todo"), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  const daysUntilDeletion = useMemo(() => {
    if (!project?.archivedAt) {
      return LIMITS.ARCHIVE_TTL_DAYS;
    }
    const elapsed = Math.floor((Date.now() - project.archivedAt) / (1000 * 60 * 60 * 24));
    return Math.max(0, LIMITS.ARCHIVE_TTL_DAYS - elapsed);
  }, [project?.archivedAt]);

  const handleToggleStatus = useCallback(
    (task: TaskWithSubtasks) => {
      if (pendingToggle.current) {
        updateTaskStatus(pendingToggle.current.taskId, pendingToggle.current.newStatus);
        pendingToggle.current = null;
      }
      const newStatus = task.status === "todo" ? "done" : "todo";
      pendingToggle.current = { taskId: task.id, newStatus };
      setExitingTaskId(task.id);
    },
    [updateTaskStatus],
  );

  const handleExitComplete = useCallback(() => {
    if (pendingToggle.current) {
      updateTaskStatus(pendingToggle.current.taskId, pendingToggle.current.newStatus);
      pendingToggle.current = null;
    }
    setExitingTaskId(null);
  }, [updateTaskStatus]);

  const handleDragEnd = useCallback(
    ({ data, from, to }: { data: TaskWithSubtasks[]; from: number; to: number }) => {
      if (from === to) {
        return;
      }
      const draggedTask = data[to];
      const afterTask = to > 0 ? data[to - 1] : null;
      const beforeTask = to < data.length - 1 ? data[to + 1] : null;
      reorderTask(draggedTask.id, afterTask?.id ?? null, beforeTask?.id ?? null);
    },
    [reorderTask],
  );

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<TaskWithSubtasks>) => (
      <AnimatedCell exiting={exitingTaskId === item.id} onExitDone={handleExitComplete}>
        <TaskCard
          task={item}
          isArchived={isArchived}
          drag={isArchived ? undefined : drag}
          isActive={isActive}
          onToggleStatus={() => handleToggleStatus(item)}
          onDelete={() => removeTask(item.id)}
          onToggleSubtask={(subtaskId) => handleToggleSubtaskOnCard(item.id, subtaskId)}
          onReorderSubtask={(subtaskId, afterId, beforeId) => handleReorderSubtaskOnCard(item.id, subtaskId, afterId, beforeId)}
          onUpdateSubtaskTitle={(subtaskId, title) => handleUpdateSubtaskTitleOnCard(item.id, subtaskId, title)}
          onUpdateTaskTitle={(title) => handleUpdateTaskTitleOnCard(item.id, title)}
          onDeleteSubtask={(subtaskId) => handleDeleteSubtaskOnCard(item.id, subtaskId)}
          onDueDateChange={(date) => handleDueDateChangeOnCard(item.id, date)}
          onCreateSubtask={(title) => handleCreateSubtaskOnCard(item.id, title)}
          onUpdateNote={(note) => handleUpdateNoteOnCard(item.id, note)}
        />
      </AnimatedCell>
    ),
    [
      isArchived,
      handleToggleStatus,
      removeTask,
      exitingTaskId,
      handleExitComplete,
      handleToggleSubtaskOnCard,
      handleReorderSubtaskOnCard,
      handleUpdateSubtaskTitleOnCard,
      handleUpdateTaskTitleOnCard,
      handleDeleteSubtaskOnCard,
      handleDueDateChangeOnCard,
      handleCreateSubtaskOnCard,
      handleUpdateNoteOnCard,
    ],
  );

  const handleArchivePress = () => {
    Alert.alert("Archive Project", `"${project?.name}" will be automatically deleted after ${LIMITS.ARCHIVE_TTL_DAYS} days.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: () => {
          archive()
            .then(() => navigation.goBack())
            .catch(() => {});
        },
      },
    ]);
  };

  const handleUnarchivePress = () => {
    unarchive().catch(() => {});
  };

  const handleDeletePress = () => {
    Alert.alert("Delete Project", "This action cannot be undone. All tasks will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          remove()
            .then(() => navigation.goBack())
            .catch(() => {});
        },
      },
    ]);
  };

  const ListHeader = (
    <View style={styles.headerContainer}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronLeft size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        {isEditingName ? (
          <TextInput
            ref={nameInputRef}
            style={[styles.projectName, styles.projectNameInput, { color: colors.textPrimary }]}
            value={editedName}
            onChangeText={(text) => setEditedName(text.replace(/\n/g, " "))}
            onKeyPress={(e) => {
              if (e.nativeEvent.key === "Enter") {
                e.preventDefault?.();
                handleNameSubmit();
              }
            }}
            onBlur={handleNameSubmit}
            multiline
            submitBehavior="blurAndSubmit"
            maxLength={LIMITS.MAX_PROJECT_NAME_LENGTH}
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity style={styles.projectNameButton} onPress={handleNamePress} activeOpacity={isArchived ? 1 : 0.7}>
            <Text style={[styles.projectName, { color: colors.textPrimary }]}>{project?.name ?? ""}</Text>
          </TouchableOpacity>
        )}
        {!isArchived && (
          <TouchableOpacity onPress={handleArchivePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginTop: 1 }}>
            <Archive size={22} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Archived banner */}
      {isArchived && (
        <View style={styles.archivedBanner}>
          <Text style={styles.archivedBannerText}>
            Archived — will be deleted {daysUntilDeletion < 1 ? "soon" : `in ${daysUntilDeletion} day${daysUntilDeletion !== 1 ? "s" : ""}`}
          </Text>
        </View>
      )}

      {/* Limit error banner */}
      {limitError && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitBannerText}>{limitError}</Text>
          <TouchableOpacity onPress={clearLimitError}>
            <Text style={styles.limitDismiss}>{"\u2715"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* General error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Task form */}
      {!isArchived && <TaskForm onSubmit={handleCreateTask} />}
    </View>
  );

  const ListFooter = (
    <View>
      {/* Pending task skeletons */}
      {pendingTaskCount > 0 && (
        <View>
          {Array.from({ length: pendingTaskCount }).map((_, i) => (
            <TaskCardSkeleton key={`pending-${i}`} />
          ))}
        </View>
      )}

      {/* Done tasks */}
      {doneTasks.map((task) => (
        <AnimatedCell key={task.id} exiting={exitingTaskId === task.id} onExitDone={handleExitComplete}>
          <TaskCard
            task={task}
            isArchived={isArchived}
            onToggleStatus={() => handleToggleStatus(task)}
            onDelete={() => removeTask(task.id)}
            onToggleSubtask={(subtaskId) => handleToggleSubtaskOnCard(task.id, subtaskId)}
            onUpdateSubtaskTitle={(subtaskId, title) => handleUpdateSubtaskTitleOnCard(task.id, subtaskId, title)}
            onUpdateTaskTitle={(title) => handleUpdateTaskTitleOnCard(task.id, title)}
          />
        </AnimatedCell>
      ))}

      {/* Empty state */}
      {!isLoading && tasks.length === 0 && pendingTaskCount === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{isArchived ? "No tasks" : "No tasks yet"}</Text>
          {!isArchived && <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Create your first task to get started.</Text>}
        </View>
      )}

      {/* Archived project actions */}
      {isArchived && (
        <View style={styles.archivedActions}>
          <TouchableOpacity style={styles.unarchiveButton} onPress={handleUnarchivePress} activeOpacity={0.7}>
            <ArchiveRestore size={18} color="#ffffff" />
            <Text style={styles.archivedActionText}>Unarchive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress} activeOpacity={0.7}>
            <Trash2 size={18} color="#ffffff" />
            <Text style={styles.archivedActionText}>Permanently Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const ListEmpty = isLoading ? <TaskListSkeleton /> : null;

  return (
    <>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={Platform.OS === "android" ? ["top", "bottom"] : ["top"]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <DraggableFlatList<TaskWithSubtasks>
            data={todoTasks}
            extraData={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderDraggableItem}
            onDragEnd={handleDragEnd}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            ListFooterComponent={ListFooter}
            containerStyle={styles.flex}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isLoading && project !== null} onRefresh={refresh} tintColor={colors.activityIndicator} />}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    gap: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  projectNameButton: {
    flex: 1,
  },
  projectName: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
  },
  projectNameInput: {
    flex: 1,
    padding: 0,
  },
  archivedActions: {
    gap: 12,
    marginTop: 24,
  },
  unarchiveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dd6b20",
    borderRadius: 10,
    paddingVertical: 14,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#e53e3e",
    borderRadius: 10,
    paddingVertical: 14,
  },
  archivedActionText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Nunito-SemiBold",
  },
  archivedBanner: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fbbf24",
    borderRadius: 8,
    padding: 12,
  },
  archivedBannerText: {
    color: "#92400e",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fbbf24",
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  limitBannerText: {
    flex: 1,
    color: "#92400e",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  limitDismiss: {
    color: "#b45309",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Nunito-SemiBold",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
  },
});
