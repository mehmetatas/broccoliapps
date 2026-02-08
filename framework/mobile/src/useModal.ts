import { useCallback, useState } from "react";

type UseModalReturn<T = undefined> = {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
};

export const useModal = <T = undefined>(): UseModalReturn<T> => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return { isOpen, data, open, close };
};
