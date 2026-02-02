import { globalConfig, sendMagicLink } from "@broccoliapps/shared";
import { useState } from "preact/hooks";
import { AppleIcon, EmailIcon, GoogleIcon } from "./icons";

export type AuthCardAccent = {
  badge: string;
  icon: string;
  link: string;
  inputFocus: string;
  button: string;
};

export type AuthCardProps = {
  appId: string;
  accent: AuthCardAccent;
  onClose?: () => void;
};

type EmailStatus = "idle" | "sending" | "sent" | "error";

export const AuthCard = ({ appId, accent, onClose }: AuthCardProps) => {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [error, setError] = useState("");

  const signInWithGoogle = () => {
    window.location.href = `${globalConfig.apps["broccoliapps-com"].baseUrl}/auth?app=${appId}&provider=google`;
  };

  const signInWithApple = () => {
    window.location.href = `${globalConfig.apps["broccoliapps-com"].baseUrl}/auth?app=${appId}&provider=apple`;
  };

  const handleEmailSignIn = async () => {
    if (!email) {
      return;
    }

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
          <div class={`rounded-full ${accent.badge} p-3`}>
            <EmailIcon class={`h-6 w-6 ${accent.icon}`} />
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
          class={`mt-6 text-sm ${accent.link}`}
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
        onClick={signInWithGoogle}
        class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {/* Apple Sign In */}
      <button
        onClick={signInWithApple}
        class="mt-3 flex w-full items-center justify-center gap-3 rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-900"
      >
        <AppleIcon />
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
          class={`w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 ${accent.inputFocus}`}
          onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
        />
        <button
          onClick={handleEmailSignIn}
          disabled={!email || emailStatus === "sending"}
          class={`w-full rounded-lg px-4 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 ${accent.button}`}
        >
          {emailStatus === "sending" ? "Sending..." : "Continue with Email"}
        </button>
        {error &&
          <p class="text-sm text-red-600">{error}</p>
        }
      </div>

      <p class="mt-6 text-center text-xs text-gray-500">
        By continuing, you agree to our <a href="/terms" target="_blank" class="underline">Terms of Service</a> and <a href="/privacy" target="_blank" class="underline">Privacy Policy</a>.
      </p>
    </div>
  );
};
