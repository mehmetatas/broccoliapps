import { Check, X } from "lucide-preact";

import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Spinner } from "./Spinner";

const URL_REGEX = /https:\/\/\S+/g;
const TRAILING_PUNCT = /[.,)\]]+$/;

const linkifyLine = (text: string): ComponentChildren[] => {
  const parts: ComponentChildren[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_REGEX)) {
    const start = match.index;
    let url = match[0];
    const trailing = TRAILING_PUNCT.exec(url);
    if (trailing) {
      url = url.slice(0, -trailing[0].length);
    }
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e: MouseEvent) => e.stopPropagation()}
        class="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
      >
        {url}
      </a>,
    );
    lastIndex = start + url.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
};

type EditableTextProps = {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  maxLength?: number;
  editRequested?: boolean;
  onEditStarted?: () => void;
  onEditEnded?: () => void;
  allowEmpty?: boolean;
  linkify?: boolean;
  resetAfterSave?: boolean;
  saving?: boolean;
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
  editRequested,
  onEditStarted,
  onEditEnded,
  allowEmpty = false,
  linkify = false,
  resetAfterSave = false,
  saving = false,
}: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [wantToExit, setWantToExit] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (editRequested && !disabled && !isEditing) {
      setIsEditing(true);
      onEditStarted?.();
    }
  }, [editRequested, disabled, isEditing, onEditStarted]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
      // Auto-grow textarea on edit start
      const textarea = inputRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditing]);

  useEffect(() => {
    if (wantToExit && !saving) {
      setWantToExit(false);
      setIsEditing(false);
      onEditEnded?.();
    }
  }, [wantToExit, saving, onEditEnded]);

  const handleSave = () => {
    if (savingRef.current) {
      savingRef.current = false;
      setIsEditing(false);
      onEditEnded?.();
      return;
    }
    const trimmed = (multiline ? editValue : editValue.replace(/\n/g, " ")).trim();
    if (maxLength && trimmed.length > maxLength) {
      return;
    }
    if ((trimmed || allowEmpty) && trimmed !== value) {
      onSave(trimmed);
    } else {
      setEditValue(value);
    }
    if (multiline) {
      setWantToExit(true);
    } else {
      setIsEditing(false);
      onEditEnded?.();
    }
  };

  const handleSaveAndContinue = () => {
    const trimmed = editValue.replace(/\n/g, " ").trim();
    if (maxLength && trimmed.length > maxLength) {
      return;
    }
    if (trimmed || allowEmpty) {
      savingRef.current = true;
      onSave(trimmed);
    }
    setEditValue(value);
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onEditEnded?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (!multiline || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (multiline) {
        handleSave();
      } else if (resetAfterSave) {
        handleSaveAndContinue();
      } else {
        (e.target as HTMLElement).blur();
      }
    } else if (e.key === "Tab" && resetAfterSave) {
      e.preventDefault();
      handleSaveAndContinue();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      onEditStarted?.();
    }
  };

  if (isEditing) {
    const inputClass = `
      w-full px-2 py-1 -mx-2 -my-1 rounded-none
      focus:outline-none
      text-neutral-900 dark:text-neutral-100 bg-transparent
      ${className}
    `.trim();

    const ratio = maxLength ? editValue.length / maxLength : 0;
    const overCount = maxLength ? editValue.length - maxLength : 0;
    const barColor = ratio >= 1 ? "bg-red-500/50" : ratio >= 0.9 ? "bg-orange-500/50" : ratio >= 0.8 ? "bg-yellow-500/50" : "bg-blue-500/50";
    const barWidth = maxLength ? `${Math.min(100, ratio * 100)}%` : "0%";
    const inputMaxLength = maxLength ? Math.floor(maxLength * 1.5) : undefined;

    const progressBar = (
      <div>
        {maxLength ? (
          <div class="h-px bg-neutral-200 dark:bg-neutral-700">
            <div class={`h-full ${barColor} transition-all`} style={{ width: barWidth }} />
          </div>
        ) : (
          <div class="h-px bg-neutral-300 dark:bg-neutral-600" />
        )}
        {overCount > 0 ? (
          <p class="text-xs text-red-500 mt-1">
            Delete {overCount} {overCount === 1 ? "character" : "characters"}
          </p>
        ) : (
          ratio >= 0.8 && <p class="text-xs text-neutral-400 mt-1">{maxLength! - editValue.length} remaining</p>
        )}
      </div>
    );

    if (multiline) {
      const actionBtnClass = "p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors";

      return (
        <div class="-mx-2 -my-1">
          <div class="relative">
            <textarea
              ref={inputRef}
              value={editValue}
              onInput={(e) => {
                const textarea = e.target as HTMLTextAreaElement;
                setEditValue(textarea.value);
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              maxLength={inputMaxLength}
              class={`${inputClass} min-h-[80px] max-h-[50vh] resize-none !-mx-0 !-my-0`}
              placeholder={placeholder}
              disabled={saving}
            />
            <div class="absolute bottom-1 right-1 flex items-center gap-1">
              {saving ? (
                <div class="p-1">
                  <Spinner size={16} />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    class={`${actionBtnClass} text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCancel}
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    class={`${actionBtnClass} text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSave}
                  >
                    <Check size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          {progressBar}
        </div>
      );
    }

    return (
      <div>
        <textarea
          ref={inputRef}
          value={editValue}
          onInput={(e) => {
            const textarea = e.target as HTMLTextAreaElement;
            const cleaned = textarea.value.replace(/\n/g, " ");
            setEditValue(cleaned);
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={inputMaxLength}
          rows={1}
          class={`${inputClass} resize-none overflow-hidden`}
          placeholder={placeholder}
        />
        {progressBar}
      </div>
    );
  }

  if (multiline) {
    return (
      <div
        onClick={handleClick}
        class={`
          ${disabled ? "" : "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700"}
          px-2 py-1 -mx-2 -my-1 rounded
          ${!value && !disabled ? "text-neutral-400 dark:text-neutral-500 italic" : ""}
          ${textClassName}
        `.trim()}
      >
        {value
          ? value
              .split("\n")
              .flatMap((line, index, arr) =>
                index < arr.length - 1 ? [...(linkify ? linkifyLine(line) : [line]), <br key={index} />] : linkify ? linkifyLine(line) : [line],
              )
          : placeholder}
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
      {value ? (linkify ? linkifyLine(value) : value) : placeholder}
    </span>
  );
};
