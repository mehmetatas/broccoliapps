import type { RefObject } from "preact";
import { useEffect } from "preact/hooks";

export const useClickOutside = (ref: RefObject<HTMLElement>, callback: () => void, enabled: boolean = true): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback, enabled]);
};
