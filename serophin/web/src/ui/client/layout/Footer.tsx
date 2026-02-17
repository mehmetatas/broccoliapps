export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer class="py-6 px-8 text-center bg-white/50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-500 text-sm">
      <p>&copy; {year} Broccoli Apps. All rights reserved.</p>
      <nav class="mt-2">
        <a href="/privacy" class="text-neutral-500 dark:text-neutral-400 no-underline hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
          Privacy
        </a>
        <span class="mx-2 text-neutral-400 dark:text-neutral-600">|</span>
        <a href="/terms" class="text-neutral-500 dark:text-neutral-400 no-underline hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
          Terms
        </a>
      </nav>
    </footer>
  );
};
