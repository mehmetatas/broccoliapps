export const Header = () => {
  return (
    <header class="sticky top-0 px-4 py-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 z-50">
      <div class="max-w-2xl mx-auto">
        <a href="/" class="flex items-center gap-3 no-underline">
          <img src="/static/logo-128.png" alt="Broccoli Apps" class="w-10 h-10 rounded-lg" />
          <span class="text-2xl font-bold text-neutral-900 dark:text-neutral-200">Broccoli Apps</span>
        </a>
      </div>
    </header>
  );
};
