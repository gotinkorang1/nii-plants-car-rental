import Link from "next/link";
import { redirect } from "next/navigation";

import { BookingOtpForm } from "@/components/booking/booking-otp-form";
import { readBookingAccessPending } from "@/lib/bookings/guest-session";
import { GENERIC_OTP_REQUEST_MESSAGE } from "@/lib/bookings/constants";

export default async function BookingVerifyPage() {
  const pending = await readBookingAccessPending();
  if (!pending) {
    redirect("/booking");
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Verify
      </p>
      <h1 className="mt-2 font-heading text-4xl tracking-tight">Enter your code</h1>
      <p className="mt-3 text-muted-foreground">{GENERIC_OTP_REQUEST_MESSAGE}</p>
      <div className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-border">
        <BookingOtpForm reference={pending.reference} email={pending.email} />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/booking" className="underline-offset-4 hover:underline">
          Use a different reference
        </Link>
      </p>
    </main>
  );
}
