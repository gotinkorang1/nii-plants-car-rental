"use client";

import { logoutBookingAccessAction } from "@/lib/booking/actions";
import { Button } from "@/components/ui/button";

export function BookingLogoutButton() {
  return (
    <form action={logoutBookingAccessAction}>
      <Button type="submit" variant="outline">
        Sign out of booking
      </Button>
    </form>
  );
}
