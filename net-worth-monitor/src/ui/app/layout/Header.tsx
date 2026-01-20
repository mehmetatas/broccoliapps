import { cache } from "@broccoliapps/browser";
import { useEffect, useRef, useState } from "preact/hooks";
import type { AuthUser } from "../../../shared/api-contracts";

export const Header = () => {
  const user = cache.get<AuthUser>("user");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header class="py-4 px-4 bg-white/50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <a href="/app" class="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          Net Worth Monitor
        </a>
        {user && (
          <div class="flex items-center gap-3">
            <a
              href="/app/new"
              class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Create
            </a>
            <div class="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                class="flex items-center gap-1 px-2 py-1.5 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <span class="w-7 h-7 flex items-center justify-center bg-neutral-200 dark:bg-neutral-600 rounded-full text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div class="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                  <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">{user.name}</p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                  </div>
                  <a
                    href="/app/import"
                    class="block px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Import
                  </a>
                  <a
                    href="/app/buckets"
                    class="block px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Buckets
                  </a>
                  <a
                    href="/app/closed-debts"
                    class="block px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Closed Debts
                  </a>
                  <a
                    href="/app/settings"
                    class="block px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Settings
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
