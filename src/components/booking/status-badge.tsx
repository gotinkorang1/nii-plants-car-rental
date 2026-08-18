import type { BookingStatus } from "@/lib/bookings/status";
import { cn } from "@/lib/utils";

const STATUS_TONE: Partial<
  Record<BookingStatus, "default" | "success" | "warning" | "error" | "muted">
> = {
  payment_pending: "warning",
  confirmed: "success",
  ready: "success",
  checked_out: "default",
  completed: "success",
  under_review: "warning",
  cancelled: "muted",
  expired: "muted",
  rejected: "error",
};

const TONE_CLASS = {
  default: "bg-primary/10 text-primary ring-1 ring-primary/20",
  success: "bg-[#e2f0e8] text-[#1f5c38] ring-1 ring-success/25",
  warning: "bg-[#ede4d4] text-[#5c3d12] ring-1 ring-warning/25",
  error: "bg-[#f6e4e4] text-[#8f2f2f] ring-1 ring-error/25",
  muted: "bg-muted text-muted-foreground ring-1 ring-border",
} as const;

export function BookingStatusBadge({
  status,
  label,
}: {
  status: BookingStatus;
  label: string;
}) {
  const tone = STATUS_TONE[status] ?? "default";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium",
        TONE_CLASS[tone],
      )}
    >
      {label}
    </span>
  );
}
