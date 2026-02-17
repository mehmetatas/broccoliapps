export const Header = () => {
  return (
    <header class="sticky top-0 px-4 py-4 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-indigo-100 dark:border-neutral-700 z-50">
      <div class="max-w-4xl mx-auto flex items-center">
        <a href="/" class="flex items-center gap-3 no-underline">
          <img src="/static/logo.png" alt="Serophin" class="w-8 h-8 rounded-lg" />
          <span class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Serophin</span>
        </a>
      </div>
    </header>
  );
};
