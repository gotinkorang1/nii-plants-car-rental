import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentCallbackLoading() {
  return (
    <main
      className="mx-auto w-full max-w-xl flex-1 px-6 py-12"
      aria-busy="true"
      aria-label="Confirming payment"
    >
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-11 w-4/5" />
      <Skeleton className="mt-3 h-5 w-full" />
      <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
    </main>
  );
}
