"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm">
        <LogOut data-icon="inline-start" />
        Log out
      </Button>
    </form>
  );
}
