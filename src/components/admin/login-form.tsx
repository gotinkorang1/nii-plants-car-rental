"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/lib/auth/actions";

type LoginFormProps = {
  nextPath: string;
  configured: boolean;
  errorMessage?: string;
};

export function LoginForm({
  nextPath,
  configured,
  errorMessage,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );

  const error = state?.error ?? errorMessage;

  return (
    <form action={formAction} className="space-y-5" aria-busy={pending}>
      <input type="hidden" name="next" value={nextPath} />

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {!configured ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
          Supabase is not configured in this environment. Add
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then apply
          the Phase 1 migrations before signing in.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={!configured || pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          disabled={!configured || pending}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={!configured || pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
