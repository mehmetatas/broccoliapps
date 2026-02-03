const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" d="M0,0h24v24H0V0z"></path>
    <g>
      <path d="M11.82,11.52L2.58,21.18c0,0,0,0,0,0c0.3,1.02,1.26,1.8,2.4,1.8c0.48,0,0.9-0.12,1.26-0.36l0,0l10.44-5.94L11.82,11.52z" fill="#EA4335"></path>
      <path
        d="M21.18,9.84L21.18,9.84l-4.5-2.58l-5.04,4.44l5.1,4.98l4.5-2.52c0.78-0.42,1.32-1.26,1.32-2.16C22.5,11.1,21.96,10.26,21.18,9.84z"
        fill="#FBBC04"
      ></path>
      <path d="M2.58,2.82C2.52,3,2.52,3.24,2.52,3.48v17.1c0,0.24,0,0.42,0.06,0.66l9.6-9.42L2.58,2.82z" fill="#4285F4"></path>
      <path d="M11.88,12l4.8-4.74L6.3,1.38C5.94,1.14,5.46,1.02,4.98,1.02c-1.14,0-2.16,0.78-2.4,1.8c0,0,0,0,0,0L11.88,12z" fill="#34A853"></path>
    </g>
  </svg>
);
export const HomePage = () => {
  return (
    <div class="w-full">
      {/* Hero */}
      <section class="py-10 text-center">
        <h1 class="text-4xl sm:text-[2.75rem] font-bold mb-6 tracking-tight text-neutral-900 dark:text-neutral-200">Software that respects your time</h1>
        <p class="text-xl text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-4">
          Simple apps that do their job and get out of your way. No notifications nagging you. No streaks to maintain. No guilt trips.
        </p>
      </section>

      {/* Philosophy */}
      <section class="py-10">
        <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
          <div>
            <h3 class="text-base font-semibold mb-2 text-neutral-900 dark:text-neutral-200">Do less, better</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">Each app focuses on one thing and does it well. No feature bloat, no upsells.</p>
          </div>
          <div>
            <h3 class="text-base font-semibold mb-2 text-neutral-900 dark:text-neutral-200">No tricks</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">No addictive mechanics. No gamification. No dark patterns to keep you hooked.</p>
          </div>
          <div>
            <h3 class="text-base font-semibold mb-2 text-neutral-900 dark:text-neutral-200">Your pace</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">
              Skip a day. Skip a month. The app will be there when you need it, judgement-free.
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold mb-2 text-neutral-900 dark:text-neutral-200">Your data</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">
              No selling to advertisers. No tracking across the web. Your information stays yours.
            </p>
          </div>
        </div>
      </section>

      {/* Apps */}
      <section class="py-10" id="apps">
        <h2 class="text-center text-3xl font-bold mb-12 text-neutral-900 dark:text-neutral-200">Our Apps</h2>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
          {/* !tldr */}
          <div class="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-8 border border-neutral-200 dark:border-neutral-700 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-0.5">
            <div class="flex items-center gap-4 mb-4">
              <img src="/static/nottldr.png" alt="!tldr" class="w-14 h-14 rounded-xl" />
              <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-200">!tldr</h3>
            </div>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6 text-[0.95rem]">Concise articles. Read or listen instead of scrolling.</p>
            <div class="flex flex-col gap-3">
              <a
                href="https://www.nottldr.com"
                class="flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 no-underline rounded-lg text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                target="_blank"
              >
                Web
              </a>
              <a
                href="https://apps.apple.com/au/app/tldr/id6757189366"
                class="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 no-underline rounded-lg text-sm transition-colors hover:bg-neutral-700 dark:hover:bg-neutral-300"
                target="_blank"
              >
                <AppleIcon /> App Store
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.nottldr.app.android"
                class="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 no-underline rounded-lg text-sm transition-colors hover:bg-neutral-700 dark:hover:bg-neutral-300"
                target="_blank"
              >
                <PlayStoreIcon /> Google Play
              </a>
            </div>
          </div>

          {/* Tasquito */}
          <div class="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-8 border border-neutral-200 dark:border-neutral-700 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-0.5">
            <div class="flex items-center gap-4 mb-4">
              <img src="/static/tasquito.png" alt="Tasquito" class="w-14 h-14 rounded-xl" />
              <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-200">Tasquito</h3>
            </div>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6 text-[0.95rem]">A task manager that won't guilt you about overdue tasks.</p>
            <div class="flex flex-col gap-3">
              <a
                href="https://www.tasquito.com"
                class="flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 no-underline rounded-lg text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                target="_blank"
              >
                Web
              </a>
              <div class="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-600 my-1 before:content-[''] before:flex-1 before:h-px before:bg-neutral-300 dark:before:bg-neutral-600 after:content-[''] after:flex-1 after:h-px after:bg-neutral-300 dark:after:bg-neutral-600">
                Coming Soon
              </div>
              <span class="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 rounded-lg text-sm pointer-events-none">
                <AppleIcon /> App Store
              </span>
              <span class="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 rounded-lg text-sm pointer-events-none">
                <PlayStoreIcon /> Google Play
              </span>
            </div>
          </div>

          {/* Net Worth Monitor */}
          <div class="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-8 border border-neutral-200 dark:border-neutral-700 transition-all hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-0.5">
            <div class="flex items-center gap-4 mb-4">
              <img src="/static/networthmonitor.png" alt="Net Worth Monitor" class="w-14 h-14 rounded-xl" />
              <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-200">Net Worth Monitor</h3>
            </div>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6 text-[0.95rem]">Track your net worth without obsessing over it. Once a month is plenty.</p>
            <div class="flex flex-col gap-3">
              <a
                href="https://www.networthmonitor.com"
                class="flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 no-underline rounded-lg text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                target="_blank"
              >
                Web
              </a>
              <div class="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-600 my-1 before:content-[''] before:flex-1 before:h-px before:bg-neutral-300 dark:before:bg-neutral-600 after:content-[''] after:flex-1 after:h-px after:bg-neutral-300 dark:after:bg-neutral-600">
                Coming Soon
              </div>
              <span class="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 rounded-lg text-sm pointer-events-none">
                <AppleIcon /> App Store
              </span>
              <span class="flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 rounded-lg text-sm pointer-events-none">
                <PlayStoreIcon /> Google Play
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
