import {
  securityDepositCollectionMethodEnum,
  securityDepositStatusEnum,
} from "@/lib/db/schema/enums";

export const SECURITY_DEPOSIT_STATUSES = securityDepositStatusEnum.enumValues;

export type SecurityDepositStatus = (typeof SECURITY_DEPOSIT_STATUSES)[number];

export const SECURITY_DEPOSIT_COLLECTION_METHODS =
  securityDepositCollectionMethodEnum.enumValues;

export type SecurityDepositCollectionMethod =
  (typeof SECURITY_DEPOSIT_COLLECTION_METHODS)[number];

const STATUS_LABELS: Record<SecurityDepositStatus, string> = {
  required: "Required",
  collected: "Collected",
  partially_collected: "Partially collected",
  held: "Held",
  released: "Released",
  retained: "Retained",
  not_required: "Not required",
};

const METHOD_LABELS: Record<SecurityDepositCollectionMethod, string> = {
  cash: "Cash",
  mobile_money: "Mobile money",
  bank_transfer: "Bank transfer",
  card: "Card",
  other: "Other",
};

export function parseSecurityDepositStatus(
  value?: string | null,
): SecurityDepositStatus | "" {
  if (
    value &&
    (SECURITY_DEPOSIT_STATUSES as readonly string[]).includes(value)
  ) {
    return value as SecurityDepositStatus;
  }
  return "";
}

export function securityDepositStatusLabel(status: SecurityDepositStatus): string {
  return STATUS_LABELS[status];
}

export function securityDepositCollectionMethodLabel(
  method?: SecurityDepositCollectionMethod | string | null,
): string {
  if (
    method &&
    (SECURITY_DEPOSIT_COLLECTION_METHODS as readonly string[]).includes(method)
  ) {
    return METHOD_LABELS[method as SecurityDepositCollectionMethod];
  }
  return "—";
}

export function deriveDepositStatus(
  required: number,
  collected: number,
): SecurityDepositStatus {
  if (required <= 0) {
    return "not_required";
  }
  if (collected <= 0) {
    return "required";
  }
  if (collected < required) {
    return "partially_collected";
  }
  return "collected";
}

export function matchesSecurityDepositSearch(
  row: {
    reference: string;
    email: string;
    firstName: string;
    lastName: string;
  },
  q?: string,
): boolean {
  const term = q?.trim().toLowerCase();
  if (!term) {
    return true;
  }

  const fullName = `${row.firstName} ${row.lastName}`.toLowerCase();
  return (
    row.reference.toLowerCase().includes(term) ||
    row.email.toLowerCase().includes(term) ||
    row.firstName.toLowerCase().includes(term) ||
    row.lastName.toLowerCase().includes(term) ||
    fullName.includes(term)
  );
}
