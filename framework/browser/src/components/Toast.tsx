import { useEffect, useState } from "preact/hooks";
import type { Toast as ToastType } from "../hooks/useToast";
import { toastStore } from "../hooks/useToast";

const variantClasses = {
  warning: "bg-amber-500/15 border-amber-400/50 text-amber-900 dark:text-amber-200",
  error: "bg-red-500/15 border-red-400/50 text-red-900 dark:text-red-200",
  info: "bg-blue-500/15 border-blue-400/50 text-blue-900 dark:text-blue-200",
  success: "bg-green-500/15 border-green-400/50 text-green-900 dark:text-green-200",
} as const;

type ToastItemProps = {
  toast: ToastType;
};

const ToastItem = ({ toast }: ToastItemProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (toast.delay === 0) {
      return;
    }
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => toastStore.remove(toast.id), 200);
    }, toast.delay);
    return () => clearTimeout(timer);
  }, [toast.delay, toast.id]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => toastStore.remove(toast.id), 200);
  };

  return (
    <div
      class={`px-4 py-3 border rounded-lg shadow-lg backdrop-blur-md cursor-pointer transition-all duration-200 ${variantClasses[toast.variant]} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
      onClick={handleDismiss}
    >
      <span class="text-sm">{toast.message}</span>
    </div>
  );
};

export { ToastItem };
