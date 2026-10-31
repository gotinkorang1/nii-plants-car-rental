import { BookingSearchSkeleton, FleetCardSkeleton } from "@/components/ui/content-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleResultsLoading() {
  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading available vehicles</span>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 flex-1" />
        ))}
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-10 w-1/2" />
      <div className="mt-8 max-w-3xl">
        <BookingSearchSkeleton />
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <FleetCardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
