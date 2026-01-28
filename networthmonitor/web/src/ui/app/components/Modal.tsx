import type { ComponentChildren } from "preact";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ComponentChildren;
};

export const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) {return null;}

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div class="absolute inset-0 bg-black/50" />
      <div
        class="relative bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
