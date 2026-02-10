import { useCallback, useEffect, useState } from "react";

type ToastVariant = "error" | "warning" | "success" | "info";

type ToastOptions = {
  delay?: number;
  onDismiss?: () => void;
};

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  delay: number;
  onDismiss?: () => void;
};

type Listener = () => void;

let nextId = 0;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

const add = (variant: ToastVariant, message: string, options?: ToastOptions): string => {
  const id = String(nextId++);
  toasts = [...toasts, { id, message, variant, delay: options?.delay ?? 5000, onDismiss: options?.onDismiss }];
  notify();
  return id;
};

const remove = (id: string) => {
  const toast = toasts.find((t) => t.id === id);
  toasts = toasts.filter((t) => t.id !== id);
  notify();
  toast?.onDismiss?.();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getToasts = (): Toast[] => toasts;

export const toastStore = { subscribe, getToasts, add, remove };

type UseToastReturn = {
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
};

export const useToast = (): UseToastReturn => {
  const error = useCallback((message: string, options?: ToastOptions) => add("error", message, options), []);
  const warning = useCallback((message: string, options?: ToastOptions) => add("warning", message, options), []);
  const success = useCallback((message: string, options?: ToastOptions) => add("success", message, options), []);
  const info = useCallback((message: string, options?: ToastOptions) => add("info", message, options), []);

  return { error, warning, success, info };
};

export const useToastStore = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribe(() => setTick((t) => t + 1));
  }, []);

  return getToasts();
};

export type { Toast, ToastVariant, ToastOptions };
