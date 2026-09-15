import type { BookingStatus } from "@/lib/bookings/status";

export const CLOSED_HIRE_STATUSES = [
  "cancelled",
  "expired",
  "rejected",
] as const satisfies readonly BookingStatus[];

export type CustomerSearchRecord = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookingReferences: string[];
};

export type CustomerHireSummaryInput = {
  reference: string;
  status: BookingStatus;
  pickupAt: Date;
  remainingBalance: number;
  createdAt: Date;
};

export function customerMatchesAdminSearch(
  record: CustomerSearchRecord,
  q: string,
): boolean {
  const term = q.trim().toLowerCase();
  if (!term) {
    return true;
  }

  const fields = [
    record.firstName,
    record.lastName,
    `${record.firstName} ${record.lastName}`,
    record.email,
    record.phone,
    ...record.bookingReferences,
  ];

  return fields.some((field) => field.toLowerCase().includes(term));
}

function isClosedHireStatus(status: BookingStatus): boolean {
  return (CLOSED_HIRE_STATUSES as readonly string[]).includes(status);
}

export function summarizeCustomerHires(hires: CustomerHireSummaryInput[]) {
  const byCreated = [...hires].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const latest = byCreated[0] ?? null;
  const lastPickupAt = hires.reduce<Date | null>((latestPickup, hire) => {
    if (!latestPickup || hire.pickupAt.getTime() > latestPickup.getTime()) {
      return hire.pickupAt;
    }
    return latestPickup;
  }, null);

  const outstandingBalance = hires
    .filter((hire) => !isClosedHireStatus(hire.status))
    .reduce((sum, hire) => sum + hire.remainingBalance, 0);

  return {
    bookingCount: hires.length,
    lastPickupAt,
    lastStatus: latest?.status ?? null,
    lastReference: latest?.reference ?? null,
    outstandingBalance,
  };
}
