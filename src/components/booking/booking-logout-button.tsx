"use client";

import { useFormStatus } from "react-dom";

import { logoutBookingAccessAction } from "@/lib/booking/actions";
import { Button } from "@/components/ui/button";

export function BookingLogoutButton() {
  return (
    <form action={logoutBookingAccessAction}>
      <LogoutSubmitButton />
    </form>
  );
}

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      className="h-11 px-4"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Signing out…" : "Sign out of booking"}
    </Button>
  );
}
