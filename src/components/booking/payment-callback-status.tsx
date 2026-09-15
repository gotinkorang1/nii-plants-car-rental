"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  paymentCallbackPresentation,
  type PaymentCallbackState,
} from "@/lib/payments/status-presentation";

export function PaymentCallbackStatus({ reference }: { reference: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentCallbackState>("pending");
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    let attempts = 0;
    let timeoutId: number | undefined;

    async function poll() {
      attempts += 1;
      try {
        const response = await fetch(
          `/api/payments/status?reference=${encodeURIComponent(reference)}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("Payment status request failed");
        const payload = (await response.json()) as {
          status?: string;
          bookingReference?: string | null;
        };
        if (!active) return;

        if (payload.status === "succeeded") {
          setStatus("succeeded");
          setBookingReference(payload.bookingReference ?? null);
          if (payload.bookingReference) {
            router.prefetch(`/booking/${payload.bookingReference}`);
          }
          return;
        }
        if (payload.status === "review") {
          setStatus("review");
          setBookingReference(payload.bookingReference ?? null);
          return;
        }
        if (payload.status === "failed") {
          setStatus("failed");
          return;
        }
        if (attempts < 20) {
          timeoutId = window.setTimeout(poll, 2000);
        } else {
          setTimedOut(true);
        }
      } catch {
        if (active) setStatus("error");
      }
    }

    void poll();
    return () => {
      active = false;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [reference, retryKey, router]);

  const presentation = paymentCallbackPresentation(status, timedOut);

  return (
    <div className="space-y-4" aria-busy={status === "pending" && !timedOut}>
      <div role="status" aria-live="polite">
        <p className="font-medium">{presentation.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {presentation.description}
        </p>
      </div>
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
      {status === "error" || timedOut ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 px-4"
          onClick={() => {
            setStatus("pending");
            setTimedOut(false);
            setRetryKey((value) => value + 1);
          }}
        >
          Check again
        </Button>
      ) : null}
    </div>
  );
}
