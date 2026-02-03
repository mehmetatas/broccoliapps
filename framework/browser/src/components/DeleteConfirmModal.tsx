import { Modal } from "./Modal";

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  isLoading?: boolean;
};

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, itemName, isLoading = false }: DeleteConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} confirmText="Delete" confirmVariant="danger" onConfirm={onConfirm} isLoading={isLoading}>
      <p class="text-neutral-600 dark:text-neutral-400">Are you sure you want to delete "{itemName}"? This action cannot be undone.</p>
    </Modal>
  );
};
