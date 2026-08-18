import { Skeleton } from "@/components/ui/skeleton";

export function FleetCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-3/4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}

export function BookingSearchSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
