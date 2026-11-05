"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";

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
          { cache: "no-store", signal: AbortSignal.timeout(8_000) },
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
  const waiting = status === "pending" && !timedOut;

  return (
    <div className="space-y-4" aria-busy={waiting}>
      <div
        className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-4"
        role="status"
        aria-live="polite"
      >
        <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
          {waiting ? (
            <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
          ) : status === "succeeded" ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <CircleAlert className="size-5" />
          )}
        </span>
        <div>
          <p className="font-medium">{presentation.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {presentation.description}
          </p>
        </div>
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
      {!bookingReference && !waiting ? (
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
