export type PaymentCallbackState =
  | "pending"
  | "succeeded"
  | "review"
  | "failed"
  | "error";

export function paymentCallbackPresentation(
  state: PaymentCallbackState,
  timedOut = false,
) {
  if (state === "succeeded") {
    return {
      title: "Payment received.",
      description: "Your booking is confirmed and your payment has been recorded.",
      tone: "success" as const,
    };
  }

  if (state === "review") {
    return {
      title: "Payment received — confirming availability.",
      description:
        "Your payment is safe. Our team is confirming the vehicle allocation and will contact you if anything needs attention.",
      tone: "review" as const,
    };
  }

  if (state === "failed") {
    return {
      title: "We could not confirm this payment.",
      description:
        "No booking changes were made. You can return to your booking and try again or contact us for help.",
      tone: "error" as const,
    };
  }

  if (state === "error") {
    return {
      title: "We are having trouble checking the payment.",
      description:
        "Your payment may still be processing. Try checking again before starting another payment.",
      tone: "error" as const,
    };
  }

  return {
    title: timedOut ? "Payment confirmation is taking longer than usual." : "Confirming your payment...",
    description: timedOut
      ? "Check your booking status shortly or contact support if it does not update."
      : "Please keep this page open while we verify the payment securely.",
    tone: "pending" as const,
  };
}
