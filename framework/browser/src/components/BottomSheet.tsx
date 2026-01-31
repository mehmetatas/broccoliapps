import type { ComponentChildren } from "preact";

export const BottomSheet = ({ children, onClose }: { children: ComponentChildren; onClose: () => void }) => (
  <div class="fixed inset-0 z-50 lg:hidden">
    {/* Backdrop */}
    <div class="absolute inset-0 bg-black/50" onClick={onClose} />

    {/* Bottom sheet */}
    <div class="absolute bottom-0 left-0 right-0 animate-slide-up">
      <div class="rounded-t-2xl bg-gray-50 p-4 pt-2">
        {/* Handle */}
        <div class="mx-auto mb-2 h-1 w-12 rounded-full bg-gray-300" />
        {children}
      </div>
    </div>

    {/* Slide up animation */}
    <style>{`
      @keyframes slide-up {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }
      .animate-slide-up {
        animation: slide-up 0.3s ease-out;
      }
    `}</style>
  </div>
);
