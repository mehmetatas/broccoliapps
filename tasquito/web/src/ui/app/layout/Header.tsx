export const Header = () => {
  return (
    <header class="py-4 px-4 bg-white/50 border-b border-neutral-200">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <a href="/app" class="text-xl font-semibold text-neutral-800">
          Tasquito
        </a>
        <nav class="flex items-center gap-4">
          <a
            href="/app"
            class="text-sm text-neutral-600 hover:text-neutral-800"
          >
            Tasks
          </a>
        </nav>
      </div>
    </header>
  );
};
