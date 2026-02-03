import { PageError } from "@broccoliapps/backend";

export const ErrorPage = ({ status, message, details }: PageError) => {
  return (
    <div class="text-center py-16 px-8">
      <h1 class="text-6xl text-neutral-900 dark:text-neutral-200 mb-4">{status}</h1>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">{message}</p>
      {details && details.length > 0 && (
        <ul class="text-left mx-auto max-w-md mb-6">
          {details.map((detail, i) => (
            <li key={i}>{detail}</li>
          ))}
        </ul>
      )}
      <a href="/" class="text-neutral-500 dark:text-neutral-400 font-semibold hover:underline">
        Go back home
      </a>
    </div>
  );
};
