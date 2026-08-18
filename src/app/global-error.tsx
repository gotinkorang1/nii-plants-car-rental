"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f7f3eb] text-[#181a18] antialiased">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-[#66645f]">
            The application encountered an unexpected error.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 inline-flex w-fit rounded-lg bg-[#245844] px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
