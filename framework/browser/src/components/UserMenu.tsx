import type { AuthUserDto } from "@broccoliapps/shared";
import { Settings } from "lucide-preact";
import { useRef, useState } from "preact/hooks";
import { getAuthUser } from "../auth-cache";
import { useClickOutside } from "../hooks/useClickOutside";

export const UserMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsMenuOpen(false), isMenuOpen);

  const user = getAuthUser() as AuthUserDto | null;

  if (!user) {
    return null;
  }

  const userInitial = user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <div class="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        class="flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <span class="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">{userInitial}</span>
      </button>

      {isMenuOpen && (
        <div class="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50">
          <div class="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700">
            {user.name && <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{user.name}</p>}
            <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
          </div>
          <div class="py-1">
            <a
              href="/app/settings"
              class="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings size={16} />
              Settings
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
