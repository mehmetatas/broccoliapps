import { useModal } from "@broccoliapps/browser";
import { getTaskCapabilities, getTaskMenuActions, type TaskDto, type TaskMenuAction } from "@broccoliapps/tasquito-shared";
import { CalendarDays, ListTodo, StickyNote, Trash2 } from "lucide-preact";
import { useState } from "preact/hooks";

const ACTION_ICONS = {
  "add-subtask": <ListTodo size={16} />,
  "due-date": <CalendarDays size={16} />,
  "add-note": <StickyNote size={16} />,
  delete: <Trash2 size={16} />,
} as const;

const ACTION_LABELS: Record<TaskMenuAction, string> = {
  "add-subtask": "Add Subtask",
  "due-date": "Set Due Date",
  "add-note": "Add Note",
  delete: "Delete",
};

type UseTaskCardStateInput = {
  task: TaskDto & { subtasks: TaskDto[] };
  isArchived: boolean;
  updateDueDate: (date: string | undefined) => void;
  remove: () => void;
};

export const useTaskCardState = ({ task, isArchived, updateDueDate, remove }: UseTaskCardStateInput) => {
  const [showMenu, setShowMenu] = useState(false);
  const [noteEditRequested, setNoteEditRequested] = useState(false);
  const [subtaskAddRequested, setSubtaskAddRequested] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const deleteModal = useModal();

  const capabilities = getTaskCapabilities(task, isArchived);
  const { isDone } = capabilities;
  const actions = getTaskMenuActions(task, capabilities);

  const actionHandlers: Record<string, () => void> = {
    "add-subtask": () => setSubtaskAddRequested(true),
    "due-date": () => setShowDatePicker(true),
    "add-note": () => setNoteEditRequested(true),
    delete: () => deleteModal.open(),
  };

  const menuItems = actions.map((action) => ({
    label: ACTION_LABELS[action],
    onClick: actionHandlers[action]!,
    icon: ACTION_ICONS[action],
    ...(action === "delete" && { variant: "destructive" as const }),
  }));

  return {
    capabilities,
    isDone,
    showMenu,
    setShowMenu,
    noteEditRequested,
    setNoteEditRequested,
    subtaskAddRequested,
    setSubtaskAddRequested,
    showDatePicker,
    setShowDatePicker,
    menuItems,
    deleteModal,
  };
};
