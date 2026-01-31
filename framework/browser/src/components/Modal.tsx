import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { Button } from "./Button";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ComponentChildren;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmVariant?: "primary" | "danger" | "warning";
  isLoading?: boolean;
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  confirmVariant = "primary",
  isLoading = false,
}: ModalProps) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div class="relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        </div>

        {/* Content */}
        <div class="px-6 py-4">{children}</div>

        {/* Footer */}
        <div class="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          {onConfirm && confirmText && (
            <Button variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
              {isLoading ? "Loading..." : confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
