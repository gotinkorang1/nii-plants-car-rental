import { FleetCardSkeleton } from "@/components/ui/content-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function FleetLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-10 w-1/2" />
      <Skeleton className="mt-3 h-5 w-2/3" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <FleetCardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
