import type { RefObject } from "preact";
import { useEffect } from "preact/hooks";

/**
 * Hook to detect clicks outside a referenced element
 * @param ref - Reference to the element to monitor
 * @param callback - Function to call when a click occurs outside the element
 * @param enabled - Whether the hook is active (default: true)
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement>,
  callback: () => void,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) {return;}

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback, enabled]);
};
