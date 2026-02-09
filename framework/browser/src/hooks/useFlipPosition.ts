import type { RefObject } from "preact";
import { useLayoutEffect, useState } from "preact/hooks";

export const useFlipPosition = (ref: RefObject<HTMLElement | null>, isOpen: boolean): boolean => {
  const [flipped, setFlipped] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen || !ref.current) {
      setFlipped(false);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    setFlipped(rect.bottom > window.innerHeight);
  }, [isOpen, ref]);

  return flipped;
};
