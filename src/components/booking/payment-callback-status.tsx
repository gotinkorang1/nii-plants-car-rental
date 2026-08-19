"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PaymentCallbackStatus({ reference }: { reference: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "succeeded" | "failed" | "review">(
    "pending",
  );
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    let active = true;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      const response = await fetch(
        `/api/payments/status?reference=${encodeURIComponent(reference)}`,
        { cache: "no-store" },
      );
      const payload = (await response.json()) as {
        status?: string;
        bookingReference?: string | null;
        message?: string;
      };
      if (!active) {
        return;
      }

      if (payload.status === "succeeded") {
        setStatus("succeeded");
        setMessage("Payment received.");
        setBookingReference(payload.bookingReference ?? null);
        if (payload.bookingReference) {
          router.prefetch(`/booking/${payload.bookingReference}`);
        }
        return;
      }
      if (payload.status === "review") {
        setStatus("review");
        setMessage("Payment received — we are confirming vehicle availability.");
        setBookingReference(payload.bookingReference ?? null);
        return;
      }
      if (payload.status === "failed") {
        setStatus("failed");
        setMessage("We could not confirm this payment.");
        return;
      }
      if (attempts < 20) {
        window.setTimeout(poll, 2000);
      } else {
        setMessage(
          "Your payment is still being confirmed. Check your booking shortly or contact support.",
        );
      }
    }

    void poll();
    return () => {
      active = false;
    };
  }, [reference, router]);

  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="text-sm">
        {message}
      </p>
      {status === "succeeded" && bookingReference ? (
        <Button asChild size="lg" className="h-11 px-4">
          <Link href={`/booking/${bookingReference}`}>View booking</Link>
        </Button>
      ) : null}
      {status === "review" && bookingReference ? (
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href={`/booking/${bookingReference}`}>View booking status</Link>
        </Button>
      ) : null}
      {!bookingReference ? (
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href="/booking">Access your booking</Link>
        </Button>
      ) : null}
    </div>
  );
}
