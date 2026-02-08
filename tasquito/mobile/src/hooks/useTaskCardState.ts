import { LIMITS, type TaskDto } from "@broccoliapps/tasquito-shared";
import { useCallback, useRef, useState } from "react";
import { Platform, TextInput } from "react-native";

type TaskWithSubtasks = TaskDto & { subtasks: TaskDto[] };

type UseTaskCardStateInput = {
  task: TaskWithSubtasks;
  isArchived?: boolean;
  updateTitle: (title: string) => Promise<void>;
  updateDueDate: (date: string | undefined) => void;
};

export const useTaskCardState = ({ task, isArchived, updateTitle, updateDueDate }: UseTaskCardStateInput) => {
  const isDone = task.status === "done";
  const subtaskCount = task.subtasks.length;

  // Capability flags
  const canEditDueDate = !isArchived && !isDone;
  const canEditNote = !isArchived && !isDone;
  const canAddSubtask = !isArchived && !isDone && subtaskCount < LIMITS.MAX_SUBTASKS_PER_TASK;
  const canShowMoreMenu = (!task.dueDate && canEditDueDate) || (!task.note && canEditNote) || canAddSubtask;
  const canEditTaskTitle = !isArchived && !isDone;

  // Task title editing state
  const [isEditingTaskTitle, setIsEditingTaskTitle] = useState(false);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [isSavingTaskTitle, setIsSavingTaskTitle] = useState(false);
  const taskTitleInputRef = useRef<TextInput>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerInitialDate, setDatePickerInitialDate] = useState<string | undefined>(undefined);

  // Bottom modal menu state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDueDateMenu, setShowDueDateMenu] = useState(false);

  // Sub-component edit triggers
  const [noteEditRequested, setNoteEditRequested] = useState(false);
  const [subtaskAddRequested, setSubtaskAddRequested] = useState(false);

  // Task title handlers
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
        await updateTitle(trimmed);
      } finally {
        setIsSavingTaskTitle(false);
      }
    }
  }, [isEditingTaskTitle, editingTaskTitle, task.title, updateTitle]);

  // Date handlers
  const handleDueDatePress = useCallback(() => {
    if (!canEditDueDate) {
      return;
    }
    if (Platform.OS === "android") {
      if (task.dueDate) {
        setShowDueDateMenu(true);
      } else {
        setDatePickerInitialDate(undefined);
        setShowDatePicker(true);
      }
    } else {
      setDatePickerInitialDate(task.dueDate ?? new Date().toISOString().split("T")[0]);
      setShowDatePicker(true);
    }
  }, [canEditDueDate, task.dueDate]);

  const handleDateSelect = useCallback(
    (date: string) => {
      setShowDatePicker(false);
      updateDueDate(date);
    },
    [updateDueDate],
  );

  const handleClearDate = useCallback(() => {
    setShowDatePicker(false);
    updateDueDate(undefined);
  }, [updateDueDate]);

  const handleDatePickerClose = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  // More menu handlers
  const handleMoreMenuPress = useCallback(() => {
    setShowMoreMenu(true);
  }, []);

  const handleMoreMenuClose = useCallback(() => {
    setShowMoreMenu(false);
  }, []);

  // Due date menu handlers
  const handleDueDateMenuClose = useCallback(() => {
    setShowDueDateMenu(false);
  }, []);

  const handleDueDateMenuChange = useCallback(() => {
    setShowDueDateMenu(false);
    setDatePickerInitialDate(task.dueDate ?? undefined);
    setShowDatePicker(true);
  }, [task.dueDate]);

  const handleDueDateMenuRemove = useCallback(() => {
    setShowDueDateMenu(false);
    updateDueDate(undefined);
  }, [updateDueDate]);

  // More menu actions that trigger sub-component editing
  const handleAddSubtaskFromMenu = useCallback(() => {
    setShowMoreMenu(false);
    setSubtaskAddRequested(true);
  }, []);

  const handleAddNoteFromMenu = useCallback(() => {
    setShowMoreMenu(false);
    setNoteEditRequested(true);
  }, []);

  const handleNoteEditStarted = useCallback(() => {
    setNoteEditRequested(false);
  }, []);

  const handleSubtaskAddStarted = useCallback(() => {
    setSubtaskAddRequested(false);
  }, []);

  return {
    // Derived values
    isDone,

    // Capability flags
    canEditDueDate,
    canEditNote,
    canAddSubtask,
    canShowMoreMenu,
    canEditTaskTitle,

    // Task title editing
    isEditingTaskTitle,
    editingTaskTitle,
    setEditingTaskTitle,
    isSavingTaskTitle,
    taskTitleInputRef,
    handleTaskTitlePress,
    handleTaskTitleSubmit,

    // Date picker
    showDatePicker,
    datePickerInitialDate,
    handleDueDatePress,
    handleDateSelect,
    handleClearDate,
    handleDatePickerClose,

    // More menu
    showMoreMenu,
    handleMoreMenuPress,
    handleMoreMenuClose,

    // Due date menu
    showDueDateMenu,
    handleDueDateMenuClose,
    handleDueDateMenuChange,
    handleDueDateMenuRemove,

    // Sub-component edit triggers
    noteEditRequested,
    subtaskAddRequested,
    handleAddSubtaskFromMenu,
    handleAddNoteFromMenu,
    handleNoteEditStarted,
    handleSubtaskAddStarted,
  };
};
