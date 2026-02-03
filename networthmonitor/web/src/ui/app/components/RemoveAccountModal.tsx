import { Modal } from "@broccoliapps/browser";
import { useState } from "preact/hooks";

type RemoveAccountModalProps = {
  open: boolean;
  onClose: () => void;
  onArchive: () => void;
  onDelete: () => void;
  accountType: "asset" | "debt";
  isLoading: boolean;
};

export const RemoveAccountModal = ({ open, onClose, onArchive, onDelete, accountType, isLoading }: RemoveAccountModalProps) => {
  const [action, setAction] = useState<"archive" | "delete">("archive");

  const typeLabel = accountType === "asset" ? "asset" : "debt";

  const handleConfirm = () => {
    if (action === "archive") {
      onArchive();
    } else {
      onDelete();
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Remove ${typeLabel}`}
      confirmText={isLoading ? "..." : action === "archive" ? "Archive" : "Delete"}
      confirmVariant={action === "delete" ? "danger" : "primary"}
      onConfirm={handleConfirm}
      isLoading={isLoading}
    >
      <div class="space-y-4">
        <label class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <input type="radio" name="remove-action" value="archive" checked={action === "archive"} onChange={() => setAction("archive")} class="mt-1" />
          <div>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">
              Archive <span class="text-neutral-500 dark:text-neutral-400 font-normal">(Recommended)</span>
            </p>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Move to archived. This will hide the {typeLabel} from your dashboard while keeping your net worth charts accurate for the period you owned this.
            </p>
          </div>
        </label>

        <label class="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <input type="radio" name="remove-action" value="delete" checked={action === "delete"} onChange={() => setAction("delete")} class="mt-1" />
          <div>
            <p class="font-medium text-neutral-900 dark:text-neutral-100">Permanent Delete</p>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Erase all records of this {typeLabel}, as if it never existed. Use this only if you added it by mistake.
            </p>
          </div>
        </label>
      </div>
    </Modal>
  );
};
