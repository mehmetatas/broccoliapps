export type HomeProps = {};

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0,0h24v24H0V0z"></path><g><path d="M11.82,11.52L2.58,21.18c0,0,0,0,0,0c0.3,1.02,1.26,1.8,2.4,1.8c0.48,0,0.9-0.12,1.26-0.36l0,0l10.44-5.94L11.82,11.52z" fill="#EA4335"></path><path d="M21.18,9.84L21.18,9.84l-4.5-2.58l-5.04,4.44l5.1,4.98l4.5-2.52c0.78-0.42,1.32-1.26,1.32-2.16C22.5,11.1,21.96,10.26,21.18,9.84z" fill="#FBBC04"></path><path d="M2.58,2.82C2.52,3,2.52,3.24,2.52,3.48v17.1c0,0.24,0,0.42,0.06,0.66l9.6-9.42L2.58,2.82z" fill="#4285F4"></path><path d="M11.88,12l4.8-4.74L6.3,1.38C5.94,1.14,5.46,1.02,4.98,1.02c-1.14,0-2.16,0.78-2.4,1.8c0,0,0,0,0,0L11.88,12z" fill="#34A853"></path></g></svg>
);

export const HomePage = ({ }: HomeProps) => {
  return (
    <div class="landing-page">
      {/* Hero */}
      <section class="hero">
        <h1>Software that respects your time</h1>
        <p>
          Simple apps that do their job and get out of your way. No notifications nagging you. No
          streaks to maintain. No guilt trips.
        </p>
      </section>

      {/* Philosophy */}
      <section class="philosophy">
        <div class="philosophy-grid">
          <div class="philosophy-item">
            <h3>Do less, better</h3>
            <p>Each app focuses on one thing and does it well. No feature bloat, no upsells.</p>
          </div>
          <div class="philosophy-item">
            <h3>No tricks</h3>
            <p>No addictive mechanics. No gamification. No dark patterns to keep you hooked.</p>
          </div>
          <div class="philosophy-item">
            <h3>Your pace</h3>
            <p>Skip a day. Skip a month. The app will be there when you need it, judgement-free.</p>
          </div>
          <div class="philosophy-item">
            <h3>Your data</h3>
            <p>No selling to advertisers. No tracking across the web. Your information stays yours.</p>
          </div>
        </div>
      </section>

      {/* Apps */}
      <section class="apps" id="apps">
        <div class="apps-inner">
          <h2>Our Apps</h2>
          <div class="apps-grid">
            {/* !tldr */}
            <div class="app-card">
              <div class="app-card-header">
                <img src="/static/nottldr.png" alt="!tldr" />
                <h3>!tldr</h3>
              </div>
              <p>Concise articles. Read or listen instead of scrolling.</p>
              <div class="app-links">
                <a href="https://www.nottldr.com" class="app-link secondary" target="_blank">
                  Web
                </a>
                <a
                  href="https://apps.apple.com/au/app/tldr/id6757189366"
                  class="app-link"
                  target="_blank"
                >
                  <AppleIcon /> App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.nottldr.app.android"
                  class="app-link"
                  target="_blank"
                >
                  <PlayStoreIcon /> Google Play
                </a>
              </div>
            </div>

            {/* Tasquito */}
            <div class="app-card">
              <div class="app-card-header">
                <img src="/static/tasquito.png" alt="Tasquito" />
                <h3>Tasquito</h3>
              </div>
              <p>A task manager that won't guilt you about overdue tasks.</p>
              <div class="app-links">
                <a href="https://www.tasquito.com" class="app-link secondary" target="_blank">
                  Web
                </a>
                <div class="coming-soon-divider">Coming Soon</div>
                <span class="app-link disabled">
                  <AppleIcon /> App Store
                </span>
                <span class="app-link disabled">
                  <PlayStoreIcon /> Google Play
                </span>
              </div>
            </div>

            {/* Net Worth Monitor */}
            <div class="app-card">
              <div class="app-card-header">
                <img src="/static/networthmonitor.png" alt="Net Worth Monitor" />
                <h3>Net Worth Monitor</h3>
              </div>
              <p>Track your net worth without obsessing over it. Once a month is plenty.</p>
              <div class="app-links">
                <a href="https://www.networthmonitor.com" class="app-link secondary" target="_blank">
                  Web
                </a>
                <div class="coming-soon-divider">Coming Soon</div>
                <span class="app-link disabled">
                  <AppleIcon /> App Store
                </span>
                <span class="app-link disabled">
                  <PlayStoreIcon /> Google Play
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
