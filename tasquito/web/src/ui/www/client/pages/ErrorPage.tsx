type ErrorPageProps = {
  status: number;
  message: string;
  details?: string[];
};

export const ErrorPage = ({ status, message, details }: ErrorPageProps) => {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 px-4">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-neutral-800 mb-4">{status}</h1>
        <p class="text-xl text-neutral-600 mb-6">{message}</p>
        {details && details.length > 0 && (
          <ul class="text-sm text-neutral-500 mb-6">
            {details.map((detail, i) => (
              <li key={i}>{detail}</li>
            ))}
          </ul>
        )}
        <a
          href="/"
          class="inline-block px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};
