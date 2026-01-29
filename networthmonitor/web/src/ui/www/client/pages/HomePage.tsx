import { cache } from "@broccoliapps/browser";
import { globalConfig } from "@broccoliapps/shared";
import { useEffect, useState } from "preact/hooks";
import { sendMagicLink } from "../../../../shared/api-contracts";

type EmailStatus = "idle" | "sending" | "sent" | "error";

const EmailIcon = () => (
  <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const AuthCard = ({ onClose }: { onClose?: () => void }) => {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [error, setError] = useState("");

  const handleGoogleSignIn = () => {
    window.location.href = `${globalConfig.apps["broccoliapps-com"].baseUrl}/auth?app=networthmonitor&provider=google`;
  };

  const handleAppleSignIn = () => {
    window.location.href = `${globalConfig.apps["broccoliapps-com"].baseUrl}/auth?app=networthmonitor&provider=apple`;
  };

  const handleEmailSignIn = async () => {
    if (!email) return;

    setEmailStatus("sending");
    setError("");

    try {
      await sendMagicLink.invoke({ email });
      setEmailStatus("sent");
    } catch (err) {
      setEmailStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send email");
    }
  };

  if (emailStatus === "sent") {
    return (
      <div class="rounded-xl bg-white p-8 shadow-lg text-center">
        <div class="mb-4 flex justify-center">
          <div class="rounded-full bg-blue-100 p-3">
            <EmailIcon />
          </div>
        </div>
        <h2 class="mb-2 text-2xl font-semibold text-gray-900">Check your email</h2>
        <p class="text-gray-600">
          We sent a magic link to <span class="font-medium">{email}</span>. Click the link to sign in.
        </p>
        <button
          onClick={() => {
            setEmailStatus("idle");
            setEmail("");
          }}
          class="mt-6 text-sm text-blue-600 hover:text-blue-700"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div class="rounded-xl bg-white p-8 shadow-lg">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-gray-900">Get Started</h2>
        {onClose && (
          <button onClick={onClose} class="text-gray-400 hover:text-gray-600 lg:hidden">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Apple Sign In */}
      <button
        onClick={handleAppleSignIn}
        class="mt-3 flex w-full items-center justify-center gap-3 rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-900"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        Continue with Apple
      </button>

      {/* Divider */}
      <div class="my-6 flex items-center">
        <div class="flex-1 border-t border-gray-300" />
        <span class="px-4 text-sm text-gray-500">or</span>
        <div class="flex-1 border-t border-gray-300" />
      </div>

      {/* Email Sign In */}
      <div class="space-y-3">
        <input
          type="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          placeholder="Enter your email"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
        />
        <button
          onClick={handleEmailSignIn}
          disabled={!email || emailStatus === "sending"}
          class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {emailStatus === "sending" ? "Sending..." : "Continue with Email"}
        </button>
        {error && (
          <p class="text-sm text-red-600">{error}</p>
        )}
      </div>

      <p class="mt-6 text-center text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export const HomePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const refreshToken = cache.get<string>("refreshToken");
    setIsAuthenticated(!!refreshToken);
  }, []);

  const goToApp = () => {
    window.location.href = "/app";
  };

  return (
    <div class="flex min-h-screen">
      {/* Left half - Product info (visible on mobile too) */}
      <div class="flex w-full lg:w-1/2 flex-col justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-8 pb-24 lg:p-12 lg:pb-12 text-white">
        <h1 class="text-4xl lg:text-5xl font-bold mb-6">Net Worth Monitor</h1>
        <p class="text-lg lg:text-xl text-blue-100 mb-8">
          Track and grow your wealth with clarity and confidence.
        </p>
        <ul class="space-y-4 text-blue-100">
          <li class="flex items-center gap-3">
            <svg class="h-6 w-6 flex-shrink-0 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Track all your assets and liabilities in one place
          </li>
          <li class="flex items-center gap-3">
            <svg class="h-6 w-6 flex-shrink-0 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Visualize your net worth over time
          </li>
          <li class="flex items-center gap-3">
            <svg class="h-6 w-6 flex-shrink-0 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Set goals and track your progress
          </li>
        </ul>
      </div>

      {/* Right half - Sign in/Sign up (desktop only) */}
      <div class="hidden lg:flex w-1/2 flex-col items-center justify-center bg-gray-50 p-8">
        <div class="w-full max-w-md">
          {isAuthenticated ? (
            <div class="rounded-xl bg-white p-8 shadow-lg text-center">
              <h2 class="mb-4 text-2xl font-semibold text-gray-900">Welcome Back</h2>
              <p class="mb-6 text-gray-600">You're already signed in.</p>
              <button
                onClick={goToApp}
                class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Go to App
              </button>
            </div>
          ) : (
            <AuthCard />
          )}
        </div>
      </div>

      {/* Mobile sticky button */}
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-blue-900 to-transparent lg:hidden">
        <button
          onClick={isAuthenticated ? goToApp : () => setShowModal(true)}
          class="w-full rounded-lg bg-white px-4 py-4 font-semibold text-blue-600 shadow-lg transition hover:bg-gray-50"
        >
          {isAuthenticated ? "Go to App" : "Get Started"}
        </button>
      </div>

      {/* Mobile bottom sheet modal */}
      {showModal && !isAuthenticated && (
        <div class="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div class="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />

          {/* Bottom sheet */}
          <div class="absolute bottom-0 left-0 right-0 animate-slide-up">
            <div class="rounded-t-2xl bg-gray-50 p-4 pt-2">
              {/* Handle */}
              <div class="mx-auto mb-2 h-1 w-12 rounded-full bg-gray-300" />
              <AuthCard onClose={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Slide up animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
