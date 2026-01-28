export type ErrorProps = {
  status: number;
  message: string;
  details?: string[];
};

export const ErrorPage = ({ status, message, details }: ErrorProps) => {
  return (
    <div class="flex flex-col items-center justify-center text-center py-16 px-8 min-h-screen">
      <h1 class="text-8xl font-bold text-rose-500 mb-4">{status}</h1>
      <p class="text-2xl text-neutral-600 mb-6">{message}</p>
      {details && details.length > 0 && (
        <ul class="list-none mb-8 text-neutral-500">
          {details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
      <a href="/" class="text-blue-500 font-medium hover:underline">
        Go back home
      </a>
    </div>
  );
};
