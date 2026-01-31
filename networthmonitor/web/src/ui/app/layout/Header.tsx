import { useClickOutside } from "@broccoliapps/browser";
import { Bell } from "lucide-preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { AccountDto, UserDto } from "@broccoliapps/nwm-shared";
import { getDashboard, getUser, getUserSync } from "../api";
import { hasMissedUpdate } from "../utils/dateUtils";

export const Header = () => {
  const [user, setUser] = useState<UserDto | undefined>(getUserSync());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountsNeedingUpdate, setAccountsNeedingUpdate] = useState<AccountDto[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown, dropdownOpen);
  useClickOutside(notificationsRef, closeNotifications, notificationsOpen);

  useEffect(() => {
    // Fetch user if not in cache
    if (!user) {
      getUser().then(setUser).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    getDashboard().then((data) => {
      const needsUpdate = data.accounts.filter(
        (account) => !account.archivedAt && hasMissedUpdate(account.nextUpdate)
      );
      setAccountsNeedingUpdate(needsUpdate);
    });
  }, [user]);

  return (
    <header class="py-4 px-4 bg-white/50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <a href="/app" class="flex items-center gap-3 text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          <img src="/static/logo-128.png" alt="Net Worth Monitor" class="w-8 h-8 rounded-lg" />
          Net Worth Monitor
        </a>
        {user && (
          <div class="flex items-center gap-3">
            {/* Notifications bell - only show if there are accounts needing update */}
            {accountsNeedingUpdate.length > 0 && (
              <div class="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  class="relative p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <Bell size={20} />
                  <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-medium text-white bg-red-500 rounded-full">
                    {accountsNeedingUpdate.length}
                  </span>
                </button>
                {notificationsOpen && (
                  <div class="absolute right-0 mt-1 w-64 bg-white dark:bg-neutral-800 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-50">
                    <div class="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                      <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        Accounts needing update
                      </p>
                    </div>
                    {accountsNeedingUpdate.map((account) => (
                      <a
                        key={account.id}
                        href={`/app/accounts/${account.id}`}
                        class="block px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        {account.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                    href="/app/buckets"
                    class="block px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Buckets
                  </a>
                  <a
                    href="/app/archived"
                    class="block px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Archived
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
