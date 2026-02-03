import { useEffect, useRef } from "preact/hooks";
import Sortable from "sortablejs";

type DragItem = {
  id: string;
};

type UseDragAndDropOptions<T extends DragItem> = {
  items: T[];
  onReorder: (itemId: string, afterId: string | null, beforeId: string | null) => void;
  disabled?: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
};

export const useDragAndDrop = <T extends DragItem>({ onReorder, disabled = false, onDragStateChange }: UseDragAndDropOptions<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Destroy existing instance if any
    if (sortableRef.current) {
      sortableRef.current.destroy();
      sortableRef.current = null;
    }

    // Don't create sortable when disabled
    if (disabled) {
      return;
    }

    sortableRef.current = Sortable.create(container, {
      filter: "input, textarea, button, [contenteditable], .no-drag",
      preventOnFilter: false,
      onFilter: () => {
        // Filter matched - drag is cancelled automatically
        // Do nothing here to allow default browser behavior (focus)
      },
      forceFallback: true,
      animation: 150,
      ghostClass: "opacity-30",
      chosenClass: "shadow-xl",
      onStart: () => {
        onDragStateChangeRef.current?.(true);
      },
      onEnd: (evt) => {
        onDragStateChangeRef.current?.(false);
        const { oldIndex, newIndex, item: draggedEl } = evt;

        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
          return;
        }

        const draggedId = draggedEl.getAttribute("data-drag-id");
        if (!draggedId) {
          return;
        }

        // After SortableJS moves the element, the DOM is in the new order
        // Query only direct children to avoid including nested elements (like subtasks)
        const elements = Array.from(container.children).filter((el) => el.hasAttribute("data-drag-id"));
        const draggedIndex = elements.findIndex((el) => el.getAttribute("data-drag-id") === draggedId);

        if (draggedIndex === -1) {
          return;
        }

        const prevEl = elements[draggedIndex - 1];
        const nextEl = elements[draggedIndex + 1];

        const afterId = prevEl?.getAttribute("data-drag-id") ?? null;
        const beforeId = nextEl?.getAttribute("data-drag-id") ?? null;

        onReorder(draggedId, afterId, beforeId);
      },
    });

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
  }, [onReorder, disabled]);

  return {
    containerRef,
  };
};
