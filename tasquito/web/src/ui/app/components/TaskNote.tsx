import { EditableText } from "@broccoliapps/browser";
import { LIMITS } from "@broccoliapps/tasquito-shared";
import { useEffect, useRef, useState } from "preact/hooks";

type TaskNoteProps = {
  note: string | undefined;
  isArchived: boolean;
  isDone: boolean;
  editRequested?: boolean;
  onEditStarted?: () => void;
  onSave: (note: string) => void;
};

export const TaskNote = ({ note, isArchived, isDone, editRequested, onEditStarted, onSave }: TaskNoteProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isEditing || expanded) {
      return;
    }
    setIsTruncated(el.scrollHeight > el.clientHeight);
  });

  const handleSave = (value: string) => {
    setSaving(true);
    Promise.resolve(onSave(value)).finally(() => setSaving(false));
  };

  if (!note && !editRequested && !isEditing) {
    return null;
  }

  const clamp = !isEditing && !expanded && !!note;

  return (
    <div class="mt-2 pl-7">
      <div ref={containerRef} class={clamp ? "line-clamp-5" : undefined}>
        <EditableText
          value={note ?? ""}
          onSave={handleSave}
          placeholder="Add a note..."
          multiline
          disabled={isArchived || isDone}
          maxLength={LIMITS.MAX_TASK_NOTE_LENGTH}
          textClassName="text-sm text-neutral-500 dark:text-neutral-400"
          className="text-sm"
          allowEmpty
          linkify
          saving={saving}
          editRequested={editRequested}
          onEditStarted={() => {
            setIsEditing(true);
            onEditStarted?.();
          }}
          onEditEnded={() => setIsEditing(false)}
        />
      </div>
      {isTruncated && !isEditing && (
        <button type="button" onClick={() => setExpanded(!expanded)} class="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mt-1">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
