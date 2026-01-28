import type { ComponentChildren } from "preact";
import { Button } from "./Button";
import { Modal } from "./Modal";

type ConfirmActionModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ComponentChildren;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
};

export const ConfirmActionModal = ({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  loading = false,
}: ConfirmActionModalProps) => {
  return (
    <Modal open={open} onClose={onClose}>
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      <div class="text-neutral-600 dark:text-neutral-400 mb-6">
        {children}
      </div>
      <div class="flex gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          class="flex-1"
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={loading}
          class="flex-1"
        >
          {loading ? `${confirmText.replace(/[.]+$/, "")}...` : confirmText}
        </Button>
      </div>
    </Modal>
  );
};
