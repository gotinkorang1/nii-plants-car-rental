export const PAYSTACK_CURRENCY = "GHS" as const;
export const PAYSTACK_PROVIDER = "paystack" as const;

export const INITIAL_PAYMENT_PURPOSES = ["reservation", "full_rental"] as const;
export type InitialPaymentPurpose = (typeof INITIAL_PAYMENT_PURPOSES)[number];

export const ACTIVE_PAYMENT_STATUSES = [
  "created",
  "provider_pending",
  "succeeded",
] as const;

export const OPEN_PAYMENT_STATUSES = ["created", "provider_pending"] as const;
