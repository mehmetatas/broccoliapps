const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" d="M0,0h24v24H0V0z" />
    <g>
      <path d="M11.82,11.52L2.58,21.18c0,0,0,0,0,0c0.3,1.02,1.26,1.8,2.4,1.8c0.48,0,0.9-0.12,1.26-0.36l0,0l10.44-5.94L11.82,11.52z" fill="#EA4335" />
      <path d="M21.18,9.84L21.18,9.84l-4.5-2.58l-5.04,4.44l5.1,4.98l4.5-2.52c0.78-0.42,1.32-1.26,1.32-2.16C22.5,11.1,21.96,10.26,21.18,9.84z" fill="#FBBC04" />
      <path d="M2.58,2.82C2.52,3,2.52,3.24,2.52,3.48v17.1c0,0.24,0,0.42,0.06,0.66l9.6-9.42L2.58,2.82z" fill="#4285F4" />
      <path d="M11.88,12l4.8-4.74L6.3,1.38C5.94,1.14,5.46,1.02,4.98,1.02c-1.14,0-2.16,0.78-2.4,1.8c0,0,0,0,0,0L11.88,12z" fill="#34A853" />
    </g>
  </svg>
);

export const HomePage = () => {
  return (
    <div class="w-full">
      {/* Hero */}
      <section class="py-16 text-center">
        <h1 class="text-4xl sm:text-5xl font-bold mb-6 tracking-tight text-indigo-900 dark:text-indigo-200">Find Your Calm</h1>
        <p class="text-xl text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-8">
          Guided meditations, breathing exercises, and sleep sounds to help you find peace in your day. No streaks. No guilt. Just calm.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#"
            class="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-700 dark:bg-indigo-500 text-white no-underline rounded-xl text-sm font-semibold transition-colors hover:bg-indigo-800 dark:hover:bg-indigo-600"
          >
            <AppleIcon /> App Store
          </a>
          <a
            href="#"
            class="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-700 dark:bg-indigo-500 text-white no-underline rounded-xl text-sm font-semibold transition-colors hover:bg-indigo-800 dark:hover:bg-indigo-600"
          >
            <PlayStoreIcon /> Google Play
          </a>
        </div>
      </section>

      {/* Features */}
      <section class="py-12">
        <h2 class="text-center text-3xl font-bold mb-12 text-neutral-900 dark:text-neutral-200">Everything you need to unwind</h2>
        <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
          <div class="bg-white dark:bg-neutral-800 rounded-xl px-6 py-8 border border-indigo-100 dark:border-neutral-700 transition-all hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-black/30 hover:-translate-y-0.5">
            <div class="text-3xl mb-4">&#x1F9D8;</div>
            <h3 class="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-200">Meditation</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">
              Guided and unguided sessions for every experience level. Choose your duration, background sounds, and style.
            </p>
          </div>
          <div class="bg-white dark:bg-neutral-800 rounded-xl px-6 py-8 border border-indigo-100 dark:border-neutral-700 transition-all hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-black/30 hover:-translate-y-0.5">
            <div class="text-3xl mb-4">&#x1F32C;&#xFE0F;</div>
            <h3 class="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-200">Breathing Exercises</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">
              4-7-8, box breathing, and more. Visual guides and haptic feedback to help you find your rhythm.
            </p>
          </div>
          <div class="bg-white dark:bg-neutral-800 rounded-xl px-6 py-8 border border-indigo-100 dark:border-neutral-700 transition-all hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-black/30 hover:-translate-y-0.5">
            <div class="text-3xl mb-4">&#x1F319;</div>
            <h3 class="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-200">Sleep Sounds</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">
              Rain, ocean waves, forest ambiance, and more. Set a timer and drift off to soothing soundscapes.
            </p>
          </div>
          <div class="bg-white dark:bg-neutral-800 rounded-xl px-6 py-8 border border-indigo-100 dark:border-neutral-700 transition-all hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-black/30 hover:-translate-y-0.5">
            <div class="text-3xl mb-4">&#x1F4D6;</div>
            <h3 class="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-200">Meditation Course</h3>
            <p class="text-[0.95rem] text-neutral-500 dark:text-neutral-400">
              A structured 30-lesson course across three levels. Build your practice from beginner to advanced at your own pace.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section class="py-12 text-center">
        <h2 class="text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-200">Simple and honest</h2>
        <p class="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto mb-8">
          The app is free to use with all core features. The meditation course is a one-time purchase of $9.99 -- no subscriptions, no recurring fees.
        </p>
      </section>
    </div>
  );
};
