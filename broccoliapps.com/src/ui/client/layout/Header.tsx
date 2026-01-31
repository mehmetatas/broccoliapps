export const Header = () => {
  return (
    <header class="sticky top-0 flex items-center justify-between px-4 py-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 z-50">
      <a href="/" class="flex items-center gap-3 no-underline">
        <img src="/static/logo-128.png" alt="Broccoli Apps" class="w-10 h-10 rounded-lg" />
        <span class="text-2xl font-bold text-neutral-900 dark:text-neutral-200">Broccoli Apps</span>
      </a>
      <nav class="flex gap-6">
        <a href="#apps" class="no-underline text-neutral-500 dark:text-neutral-400 text-[0.95rem] transition-colors hover:text-neutral-900 dark:hover:text-neutral-200">
          Apps
        </a>
      </nav>
    </header>
  );
};
