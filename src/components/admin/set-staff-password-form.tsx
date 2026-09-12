"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { setStaffPasswordSchema } from "@/lib/validation/staff";

type Status = "loading" | "ready" | "missing" | "saving";

export function SetStaffPasswordForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(configured ? "loading" : "missing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (data.session) {
        setStatus("ready");
        return;
      }

      window.setTimeout(() => {
        void (async () => {
          if (cancelled) {
            return;
          }
          const again = await supabase.auth.getSession();
          if (!again.data.session) {
            setStatus("missing");
          }
        })();
      }, 800);
    }

    void checkSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) {
        return;
      }
      if (session) {
        setStatus("ready");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  async function onSubmit(formData: FormData) {
    setError(null);
    const parsed = setStaffPasswordSchema.safeParse({
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the password.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (updateError) {
      setStatus("ready");
      setError("The password could not be saved. Request a new invite link.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  if (!configured || status === "missing") {
    return (
      <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
        This invite or recovery link is invalid, expired, or Auth is not
        configured. Ask an administrator to send a new password link.
      </p>
    );
  }

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Preparing your account…</p>;
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={status === "saving"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={status === "saving"}
        />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : "Save password and continue"}
      </Button>
    </form>
  );
}
