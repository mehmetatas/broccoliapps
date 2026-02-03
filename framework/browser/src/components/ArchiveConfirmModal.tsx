import { Modal } from "./Modal";

type ArchiveConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  isLoading?: boolean;
  confirmText?: string;
  message?: string;
};

export const ArchiveConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  isLoading = false,
  confirmText = "Archive",
  message,
}: ArchiveConfirmModalProps) => {
  const defaultMessage = `Are you sure you want to archive "${itemName}"? The project and its tasks will be automatically deleted after 2 weeks.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} confirmText={confirmText} confirmVariant="warning" onConfirm={onConfirm} isLoading={isLoading}>
      <p class="text-neutral-600 dark:text-neutral-400">{message ?? defaultMessage}</p>
    </Modal>
  );
};
