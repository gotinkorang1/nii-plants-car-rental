"use client";

import { logoutBookingAccessAction } from "@/lib/booking/actions";
import { Button } from "@/components/ui/button";

export function BookingLogoutButton() {
  return (
    <form action={logoutBookingAccessAction}>
      <Button type="submit" variant="outline" size="lg" className="h-11 px-4">
        Sign out of booking
      </Button>
    </form>
  );
}
