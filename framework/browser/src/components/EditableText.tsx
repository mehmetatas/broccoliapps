import { RefObject } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

type EditableTextProps = {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  maxLength?: number;
};

export const EditableText = ({
  value,
  onSave,
  placeholder = "Click to edit",
  multiline = false,
  className = "",
  textClassName = "",
  disabled = false,
  maxLength,
}: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  if (isEditing) {
    const inputClass = `
      w-full px-2 py-1 border border-emerald-500 rounded
      focus:outline-none focus:ring-2 focus:ring-emerald-500
      text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800
      ${className}
    `.trim();

    const atLimit = maxLength != null && editValue.length >= maxLength;

    if (multiline) {
      return (
        <div>
          <textarea
            ref={inputRef as RefObject<HTMLTextAreaElement>}
            value={editValue}
            onInput={(e) => setEditValue((e.target as HTMLTextAreaElement).value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            class={`${inputClass} min-h-[80px] resize-none`}
            placeholder={placeholder}
          />
          {atLimit && <p class="mt-1 text-xs text-neutral-400">Character limit reached</p>}
        </div>
      );
    }

    return (
      <div>
        <input
          ref={inputRef as RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          class={inputClass}
          placeholder={placeholder}
        />
        {atLimit && <p class="mt-1 text-xs text-neutral-400">Character limit reached</p>}
      </div>
    );
  }

  return (
    <span
      onClick={handleClick}
      class={`
        ${disabled ? "" : "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700"}
        px-2 py-1 -mx-2 -my-1 rounded
        ${!value && !disabled ? "text-neutral-400 dark:text-neutral-500 italic" : ""}
        ${textClassName}
      `.trim()}
    >
      {value || placeholder}
    </span>
  );
};
