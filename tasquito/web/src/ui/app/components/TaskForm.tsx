import { LIMITS } from "@broccoliapps/tasquito-shared";
import { MoreHorizontal, X } from "lucide-preact";
import { useRef, useState } from "preact/hooks";
import { Button } from "./Button";
import { DatePicker } from "./DatePicker";

type TaskFormData = {
  title: string;
  description?: string;
  dueDate?: string;
  subtasks?: string[];
};

type TaskFormProps = {
  onSubmit: (data: TaskFormData) => void;
  placeholder?: string;
};

export const TaskForm = ({ onSubmit, placeholder = "What needs to be done?" }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: Event) => {
    e?.preventDefault();
    if (!title.trim()) {
      return;
    }

    // Submit (fire-and-forget, skeleton shows immediately)
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    });

    // Focus back to title input first (before state changes cause re-render)
    titleInputRef.current?.focus();
    // Reset form (keep expanded state)
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setSubtasks([]);
    setNewSubtaskTitle("");
  };

  const handleTitleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isExpanded) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && newSubtaskTitle.trim()) {
      e.preventDefault();
      setSubtasks((prev) => [...prev, newSubtaskTitle.trim()]);
      setNewSubtaskTitle("");
      // Keep focus on the input
      subtaskInputRef.current?.focus();
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-5">
      {/* Header: Title + Date + More Options Button */}
      <div class="flex items-center justify-between gap-3">
        <input
          ref={titleInputRef}
          type="text"
          placeholder={placeholder}
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
          onKeyDown={handleTitleKeyDown}
          class="flex-1 text-lg font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 bg-transparent border-none outline-none focus:ring-0 p-0"
        />
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          class={`p-2 rounded-lg border transition-colors ${isExpanded
            ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400"
            : "border-neutral-200 dark:border-neutral-600 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500"
            }`}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Expanded section: Description, Due Date, Subtasks, Create Button */}
      {isExpanded && (
        <div class="mt-4 space-y-4">
          {/* Description */}
          <textarea
            placeholder="Task description"
            value={description}
            onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
            rows={3}
            class="w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 dark:placeholder-neutral-500 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg resize-none outline-none focus:border-blue-300 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-500"
          />

          {/* Due Date */}
          <div>
            <h4 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
              Due Date
            </h4>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>

          {/* Subtasks Section */}
          <div>
            <h4 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
              Subtasks
            </h4>

            {/* Existing subtasks */}
            {subtasks.length > 0 && (
              <div class="space-y-0 mb-0">
                {subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    class="flex items-center justify-between py-1 px-1 group"
                  >
                    <div class="flex items-center gap-3">
                      <span class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <span class="text-sm text-neutral-700 dark:text-neutral-300">{subtask}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      class="p-1 text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subtask input or limit message */}
            {subtasks.length >= LIMITS.MAX_SUBTASKS_PER_TASK ? (
              <p class="text-xs text-neutral-500 dark:text-neutral-400 italic py-1">
                If a task needs more than {LIMITS.MAX_SUBTASKS_PER_TASK} subtasks, consider breaking it into smaller tasks.
              </p>
            ) : (
              <input
                ref={subtaskInputRef}
                type="text"
                placeholder="Add a subtask..."
                value={newSubtaskTitle}
                onInput={(e) => setNewSubtaskTitle((e.target as HTMLInputElement).value)}
                onKeyDown={handleSubtaskKeyDown}
                class="w-full text-sm text-neutral-600 dark:text-neutral-300 placeholder-neutral-400 dark:placeholder-neutral-500 bg-transparent border-none outline-none focus:ring-0 p-0 py-1"
              />
            )}
          </div>

          {/* Create Button */}
          <div class="pt-2">
            <Button
              type="submit"
              disabled={!title.trim()}
            >
              Create Task
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
