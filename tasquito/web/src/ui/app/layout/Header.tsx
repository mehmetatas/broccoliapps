import { UserMenu } from "@broccoliapps/browser";

export const Header = () => {
  return (
    <header class="py-4 px-4 bg-white/50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <a href="/app" class="flex items-center gap-3 text-xl font-semibold text-neutral-800 dark:text-neutral-100">
          <img src="/static/logo-128.png" alt="Tasquito" class="w-8 h-8 rounded-lg" />
          Tasquito
        </a>

        <UserMenu />
      </div>
    </header>
  );
};
