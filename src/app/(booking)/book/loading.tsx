import { BookingSearchSkeleton } from "@/components/ui/content-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingLoading() {
  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading availability search</span>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 flex-1" />
        ))}
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-10 w-2/3" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <Skeleton className="mt-8 aspect-[16/7] w-full rounded-2xl" />
      <div className="mt-8">
        <BookingSearchSkeleton />
      </div>
    </main>
  );
}
