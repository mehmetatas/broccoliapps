import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { useClickOutside } from "../hooks/useClickOutside";

type DropdownMenuItem = {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  icon?: ComponentChildren;
};

type DropdownMenuProps = {
  items: DropdownMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  align?: "left" | "right";
};

export const DropdownMenu = ({ items, isOpen, onClose, align = "right" }: DropdownMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      class={`absolute mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 py-1 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          class={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
            item.variant === "destructive"
              ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};
