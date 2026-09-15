import { Skeleton } from "@/components/ui/skeleton";

export default function QuoteLoading() {
  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      aria-busy="true"
    >
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 flex-1" />
        ))}
      </div>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-10 w-2/3" />
      <Skeleton className="mt-8 h-72 w-full rounded-2xl" />
    </main>
  );
}
