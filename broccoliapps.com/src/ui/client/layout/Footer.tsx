export const Footer = () => {
  return (
    <footer class="py-6 px-8 text-center bg-white/50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-500 text-sm">
      <p>&copy; {new Date().getFullYear()} Broccoli Apps. All rights reserved.</p>
      <nav class="mt-2">
        <a href="/about" class="text-neutral-500 dark:text-neutral-400 no-underline hover:underline">About</a>
        <span class="mx-2 text-neutral-400 dark:text-neutral-600">|</span>
        <a href="/privacy" class="text-neutral-500 dark:text-neutral-400 no-underline hover:underline">Privacy</a>
        <span class="mx-2 text-neutral-400 dark:text-neutral-600">|</span>
        <a href="/terms" class="text-neutral-500 dark:text-neutral-400 no-underline hover:underline">Terms</a>
      </nav>
    </footer>
  );
};
