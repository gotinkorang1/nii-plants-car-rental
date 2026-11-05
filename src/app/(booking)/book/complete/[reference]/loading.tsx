import { Skeleton } from "@/components/ui/skeleton";

export default function BookingCompleteLoading() {
  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      aria-busy="true"
      aria-label="Loading booking status"
    >
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 flex-1" />
        ))}
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-10 w-3/4" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-8 h-56 w-full rounded-2xl" />
    </main>
  );
}
