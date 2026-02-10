import { CharacterLimitIndicator, Modal, useModal, useTheme, useToast } from "@broccoliapps/mobile";
import type { TaskDto } from "@broccoliapps/tasquito-shared";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Archive, ArchiveRestore, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { type RenderItemParams } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedCell } from "../components/AnimatedCell";
import { TaskCard } from "../components/TaskCard";
import { TaskListSkeleton } from "../components/TaskCardSkeleton";
import { TaskForm, type TaskFormData } from "../components/TaskForm";
import { ProjectProvider, useProjectContext } from "../context/ProjectContext";
import type { RootStackParamList } from "../navigation/types";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type Props = NativeStackScreenProps<RootStackParamList, "ProjectDetail">;

export const ProjectDetailScreen = ({ navigation, route }: Props) => {
  const { projectId } = route.params;
  return (
    <ProjectProvider projectId={projectId}>
      <ProjectDetailContent navigation={navigation} />
    </ProjectProvider>
  );
};

type ContentProps = {
  navigation: Props["navigation"];
};

const ProjectDetailContent = ({ navigation }: ContentProps) => {
  const { colors } = useTheme();
  const toast = useToast();
  const archiveModal = useModal();
  const deleteModal = useModal();
  const deleteDoneModal = useModal();
  const [exitingTaskId, setExitingTaskId] = useState<string | null>(null);
  const pendingToggle = useRef<{ taskId: string; newStatus: "todo" | "done" } | null>(null);

  const {
    project,
    tasks,
    isLoading,
    error,
    limitError,
    clearLimitError,
    createTask,
    updateTaskStatus,
    updateName,
    reorderTask,
    archive,
    unarchive,
    remove,
    batchRemoveTasks,
    refresh,
  } = useProjectContext();

  useEffect(() => {
    if (limitError) {
      toast.warning(limitError);
      clearLimitError();
    }
  }, [limitError, clearLimitError, toast]);

  const isArchived = project?.isArchived ?? false;
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const nameInputRef = useRef<TextInput>(null);

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
    const trimmed = editedName.trim();
    if (trimmed.length > LIMITS.MAX_PROJECT_NAME_LENGTH) {
      return;
    }
    setIsEditingName(false);
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
        />
      </AnimatedCell>
    ),
    [isArchived, handleToggleStatus, exitingTaskId, handleExitComplete],
  );

  const handleArchivePress = () => {
    archiveModal.open();
  };

  const handleUnarchivePress = () => {
    unarchive().catch(() => {});
  };

  const handleDeletePress = () => {
    deleteModal.open();
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
            maxLength={Math.floor(LIMITS.MAX_PROJECT_NAME_LENGTH * 1.5)}
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity style={styles.projectNameButton} onPress={handleNamePress} activeOpacity={isArchived ? 1 : 0.7}>
            <Text style={[styles.projectName, { color: colors.textPrimary }]}>{project?.name ?? ""}</Text>
          </TouchableOpacity>
        )}
        {!isArchived && (
          <TouchableOpacity onPress={handleArchivePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.archiveButton}>
            <Archive size={22} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {isEditingName && <CharacterLimitIndicator textLength={editedName.length} softLimit={LIMITS.MAX_PROJECT_NAME_LENGTH} />}

      {/* Archived banner */}
      {isArchived && (
        <View style={styles.archivedBanner}>
          <Text style={styles.archivedBannerText}>
            Archived — will be deleted {daysUntilDeletion < 1 ? "soon" : `in ${daysUntilDeletion} day${daysUntilDeletion !== 1 ? "s" : ""}`}
          </Text>
        </View>
      )}

      {/* General error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Task form */}
      {!isArchived && <TaskForm onSubmit={handleCreateTask} autoFocus={!isLoading && tasks.length === 0} />}
    </View>
  );

  const ListFooter = (
    <View>
      {/* Done tasks */}
      {doneTasks.length > 0 && (
        <View>
          <View style={styles.doneHeader}>
            <TouchableOpacity onPress={() => setDoneExpanded((prev) => !prev)} style={styles.doneToggle} activeOpacity={0.7}>
              {doneExpanded ? <ChevronDown size={16} color={colors.textMuted} /> : <ChevronRight size={16} color={colors.textMuted} />}
              <Text style={[styles.doneToggleText, { color: colors.textMuted }]}>Done ({doneTasks.length})</Text>
            </TouchableOpacity>
            {doneExpanded && (
              <TouchableOpacity onPress={() => deleteDoneModal.open()} style={styles.deleteAllButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 size={14} color={colors.textMuted} />
                <Text style={[styles.deleteAllText, { color: colors.textMuted }]}>Delete All</Text>
              </TouchableOpacity>
            )}
          </View>
          {doneExpanded &&
            doneTasks.map((task) => (
              <AnimatedCell key={task.id} exiting={exitingTaskId === task.id} onExitDone={handleExitComplete}>
                <TaskCard task={task} isArchived={isArchived} onToggleStatus={() => handleToggleStatus(task)} />
              </AnimatedCell>
            ))}
        </View>
      )}

      {/* Empty state */}
      {!isLoading && tasks.length === 0 && (
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
      <Modal
        visible={archiveModal.isOpen}
        onClose={archiveModal.close}
        title="Archive Project"
        confirmText="Archive"
        confirmVariant="warning"
        onConfirm={() => {
          archiveModal.close();
          archive()
            .then(() => navigation.goBack())
            .catch(() => {});
        }}
      >
        <Text style={[styles.modalMessage, { color: colors.textPrimary }]}>
          "{project?.name}" will be automatically deleted after {LIMITS.ARCHIVE_TTL_DAYS} days.
        </Text>
      </Modal>
      <Modal
        visible={deleteModal.isOpen}
        onClose={deleteModal.close}
        title="Delete Project"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          deleteModal.close();
          remove()
            .then(() => navigation.goBack())
            .catch(() => {});
        }}
      >
        <Text style={[styles.modalMessage, { color: colors.textPrimary }]}>This action cannot be undone. All tasks will be permanently deleted.</Text>
      </Modal>
      <Modal
        visible={deleteDoneModal.isOpen}
        onClose={deleteDoneModal.close}
        title="Delete Done Tasks"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          deleteDoneModal.close();
          batchRemoveTasks(doneTasks.map((t) => t.id));
        }}
      >
        <Text style={[styles.modalMessage, { color: colors.textPrimary }]}>
          {doneTasks.length} done task{doneTasks.length !== 1 ? "s" : ""} will be permanently deleted.
        </Text>
      </Modal>
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
  archiveButton: {
    marginTop: 1,
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
  doneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  doneToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  doneToggleText: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteAllText: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
  },
  archivedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderColor: "#fbbf24",
  },
  archivedBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    color: "#92400e",
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    lineHeight: 22,
  },
});
