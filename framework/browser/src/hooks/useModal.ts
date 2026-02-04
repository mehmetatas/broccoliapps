import { useCallback, useState } from "preact/hooks";

type UseModalReturn<T = undefined> = {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
};

/**
 * Hook for managing modal state
 * @param initialOpen - Initial open state (default: false)
 * @returns Object with isOpen state, data, and control functions
 */
export const useModal = <T = undefined>(initialOpen: boolean = false): UseModalReturn<T> => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, data, open, close, toggle };
};
