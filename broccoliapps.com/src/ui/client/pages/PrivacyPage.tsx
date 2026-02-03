export const PrivacyPage = () => {
  return (
    <article class="max-w-2xl mx-auto p-8 bg-white/90 dark:bg-neutral-800/90 rounded-lg shadow-md dark:shadow-black/30">
      <h1 class="text-neutral-800 dark:text-neutral-200 text-3xl mb-2 font-bold">Privacy Policy</h1>
      <p class="text-neutral-500 dark:text-neutral-500 mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-700">
        <strong>Broccoli Apps</strong>
        <br />
        Last updated: January 2026
      </p>

      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        This Privacy Policy applies to all applications and services operated by Broccoli Apps ("we", "us", "our"), including:
      </p>
      <ul class="my-4 ml-6 text-neutral-600 dark:text-neutral-300 leading-relaxed list-disc">
        <li class="mb-2">!tldr (nottldr.com)</li>
        <li class="mb-2">Tasquito (tasquito.com)</li>
        <li class="mb-2">Net Worth Monitor (networthmonitor.com)</li>
      </ul>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Information We Collect</h2>

      <h3 class="text-neutral-600 dark:text-neutral-400 text-lg mt-6 mb-3 font-bold">Account Information</h3>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        When you create an account using Sign in with Google or Sign in with Apple, we collect:
      </p>
      <ul class="my-4 ml-6 text-neutral-600 dark:text-neutral-300 leading-relaxed list-disc">
        <li class="mb-2">Your name</li>
        <li class="mb-2">Your email address</li>
      </ul>

      <h3 class="text-neutral-600 dark:text-neutral-400 text-lg mt-6 mb-3 font-bold">App Data</h3>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        We store the data you create within our apps, such as content, entries, and preferences you choose to save.
      </p>

      <h3 class="text-neutral-600 dark:text-neutral-400 text-lg mt-6 mb-3 font-bold">Technical Information</h3>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        Our servers automatically collect standard technical information when you use our services:
      </p>
      <ul class="my-4 ml-6 text-neutral-600 dark:text-neutral-300 leading-relaxed list-disc">
        <li class="mb-2">App version</li>
        <li class="mb-2">Device type and operating system (derived from HTTP headers)</li>
        <li class="mb-2">IP address (from server logs)</li>
      </ul>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">We do not use analytics services or tracking tools.</p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">How We Use Your Information</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">We use your information to:</p>
      <ul class="my-4 ml-6 text-neutral-600 dark:text-neutral-300 leading-relaxed list-disc">
        <li class="mb-2">Provide and maintain our services</li>
        <li class="mb-2">Authenticate your account across Broccoli Apps</li>
        <li class="mb-2">Send emails about your account (e.g., verification) and occasional updates about our apps and new features</li>
        <li class="mb-2">Debug and improve our apps</li>
      </ul>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        We do not use your data for advertising, profiling, or any purpose other than providing our services.
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Data Storage and Security</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        Your data is stored on Amazon Web Services (AWS) servers in the United States (us-west-2/Oregon region). We implement reasonable security measures to
        protect your information.
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Third-Party Services</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">We use the following third-party services that may process your data:</p>
      <table class="w-full border-collapse my-4">
        <thead>
          <tr>
            <th class="p-3 text-left border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-700 font-semibold text-neutral-800 dark:text-neutral-200">
              Service
            </th>
            <th class="p-3 text-left border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-700 font-semibold text-neutral-800 dark:text-neutral-200">
              Purpose
            </th>
            <th class="p-3 text-left border-b border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-700 font-semibold text-neutral-800 dark:text-neutral-200">
              Data Shared
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">AWS</td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">Hosting and data storage</td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">All account and app data</td>
          </tr>
          <tr>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">Google / Apple</td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">Authentication</td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">Name, email (during sign-in)</td>
          </tr>
          <tr>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">Stripe</td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
              Payment processing (web/Android tips)
            </td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
              Payment details (handled directly by Stripe)
            </td>
          </tr>
          <tr>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">Apple</td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">In-app purchases (iOS tips)</td>
            <td class="p-3 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
              Payment details (handled directly by Apple)
            </td>
          </tr>
        </tbody>
      </table>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        We do not sell, rent, or share your personal information with any other third parties.
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Data Retention and Deletion</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        You can delete your data within each app through its settings. Deleting data in one app does not affect your data in other Broccoli Apps. Deleted data
        is permanently removed within 30 days.
      </p>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        To delete all your data across all Broccoli Apps, please contact us at{" "}
        <a href="mailto:contact@broccoliapps.com" class="text-neutral-500 dark:text-neutral-400 no-underline hover:underline">
          contact@broccoliapps.com
        </a>
        .
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Cookies</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">We do not use cookies on our websites or apps.</p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Children's Privacy</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        Our services are intended for users aged 13 and older. We do not knowingly collect information from children under 13. If you believe a child under 13
        has provided us with personal information, please contact us and we will delete it.
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">International Users</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        Our services are available worldwide. By using our services, you consent to your data being transferred to and processed in the United States.
      </p>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        For users in the European Economic Area (EEA), United Kingdom, or other regions with data protection laws: we process your data based on your consent
        (provided when you create an account) and our legitimate interest in providing our services.
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Your Rights</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">Depending on your location, you may have rights including:</p>
      <ul class="my-4 ml-6 text-neutral-600 dark:text-neutral-300 leading-relaxed list-disc">
        <li class="mb-2">Access to your personal data</li>
        <li class="mb-2">Correction of inaccurate data</li>
        <li class="mb-2">Deletion of your data</li>
        <li class="mb-2">Data portability</li>
        <li class="mb-2">Withdrawal of consent</li>
      </ul>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:contact@broccoliapps.com" class="text-neutral-500 dark:text-neutral-400 no-underline hover:underline">
          contact@broccoliapps.com
        </a>
        .
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Changes to This Policy</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
        We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the
        "Last updated" date.
      </p>

      <h2 class="text-neutral-800 dark:text-neutral-200 text-xl mt-8 mb-4 font-bold">Contact Us</h2>
      <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">If you have questions about this Privacy Policy, contact us at:</p>
      <address class="not-italic text-neutral-600 dark:text-neutral-300 leading-relaxed">
        <a href="mailto:contact@broccoliapps.com" class="text-neutral-500 dark:text-neutral-400 no-underline hover:underline">
          contact@broccoliapps.com
        </a>
        <br />
        <br />
        Broccoli Apps
        <br />
        PO Box 330
        <br />
        Annandale NSW 2038
        <br />
        Australia
      </address>
    </article>
  );
};
