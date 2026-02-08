import { AuthCard, BottomSheet, cache } from "@broccoliapps/browser";
import { useEffect, useState } from "preact/hooks";
import * as client from "../../../app/api";

const ACCENT = {
  badge: "bg-emerald-100",
  icon: "text-emerald-600",
  link: "text-emerald-600 hover:text-emerald-700",
  inputFocus: "focus:border-emerald-500 focus:ring-emerald-500",
  button: "bg-emerald-600 hover:bg-emerald-700",
};

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const refreshToken = cache.get<string>(client.CACHE_KEYS.refreshToken);
    setIsAuthenticated(!!refreshToken);
  }, []);

  const goToApp = () => {
    window.location.href = "/app";
  };

  return (
    <div class="flex min-h-screen">
      {/* Left half - Product info */}
      <div class="flex w-full lg:w-1/2 flex-col justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 pb-24 lg:p-12 lg:pb-12 text-white">
        <h1 class="text-4xl lg:text-5xl font-bold mb-6">Tasquito</h1>
        <p class="text-lg lg:text-xl text-emerald-100 mb-8">Simple, fast task management. Get things done.</p>
        <ul class="space-y-4 text-emerald-100">
          <li class="flex items-center gap-3">
            <svg class="h-6 w-6 flex-shrink-0 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Create and organize tasks effortlessly
          </li>
          <li class="flex items-center gap-3">
            <svg class="h-6 w-6 flex-shrink-0 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Track progress with status updates
          </li>
          <li class="flex items-center gap-3">
            <svg class="h-6 w-6 flex-shrink-0 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Clean, distraction-free interface
          </li>
        </ul>
      </div>

      {/* Right half - CTA (desktop only) */}
      <div class="hidden lg:flex w-1/2 flex-col items-center justify-center bg-gray-50 p-8">
        <div class="w-full max-w-md">
          {isAuthenticated ? (
            <div class="rounded-xl bg-white p-8 shadow-lg text-center">
              <h2 class="mb-4 text-2xl font-semibold text-gray-900">Welcome Back</h2>
              <p class="mb-6 text-gray-600">You're already signed in.</p>
              <button onClick={goToApp} class="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700">
                Go to App
              </button>
            </div>
          ) : (
            <AuthCard appId="tasquito" accent={ACCENT} />
          )}
        </div>
      </div>

      {/* Mobile sticky button */}
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-emerald-900 to-transparent lg:hidden">
        <button
          onClick={isAuthenticated ? goToApp : () => setShowModal(true)}
          class="w-full rounded-lg bg-white px-4 py-4 font-semibold text-emerald-600 shadow-lg transition hover:bg-gray-50"
        >
          {isAuthenticated ? "Go to App" : "Get Started"}
        </button>
      </div>

      {/* Mobile bottom sheet modal */}
      {showModal && !isAuthenticated && (
        <BottomSheet onClose={() => setShowModal(false)}>
          <AuthCard appId="tasquito" accent={ACCENT} onClose={() => setShowModal(false)} />
        </BottomSheet>
      )}
    </div>
  );
};
