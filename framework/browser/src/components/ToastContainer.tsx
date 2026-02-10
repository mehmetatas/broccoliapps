import { useToastStore } from "../hooks/useToast";
import { ToastItem } from "./Toast";

export const ToastContainer = () => {
  const toasts = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
