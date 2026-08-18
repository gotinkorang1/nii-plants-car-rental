import type { paymentPurposeEnum, paymentStatusEnum } from "@/lib/db/schema/enums";

export type PaymentPurpose = (typeof paymentPurposeEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export type SanitizedPaystackSnapshot = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string | null;
  paidAt?: string | null;
  transactionId?: string | null;
  gatewayResponse?: string | null;
  fees?: number | null;
};

export type PaystackVerification = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  transactionId: string | null;
  paidAt: Date | null;
  channel: string | null;
  gatewayResponse: string | null;
  fees: number | null;
  rawStatus: string;
};

export type PublicPaymentStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "review"
  | "not_found";

export type SafePaymentHistoryItem = {
  reference: string;
  purpose: PaymentPurpose;
  amount: number;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
};
