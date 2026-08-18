"use client";

import { useActionState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import type { SiteSettings } from "@/lib/settings/schema";

export function SiteSettingsForm({
  action,
  defaults,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: SiteSettings;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <Field label="Business name" htmlFor="businessName">
        <Input id="businessName" name="businessName" required defaultValue={defaults.businessName} />
      </Field>
      <Field label="Homepage headline" htmlFor="homepageHeadline">
        <Input id="homepageHeadline" name="homepageHeadline" defaultValue={defaults.homepageHeadline} />
      </Field>
      <Field label="Homepage subheadline" htmlFor="homepageSubheadline">
        <Textarea
          id="homepageSubheadline"
          name="homepageSubheadline"
          defaultValue={defaults.homepageSubheadline}
        />
      </Field>
      <Field label="Phone" htmlFor="phone">
        <Input id="phone" name="phone" defaultValue={defaults.phone} />
      </Field>
      <Field label="WhatsApp" htmlFor="whatsapp">
        <Input id="whatsapp" name="whatsapp" defaultValue={defaults.whatsapp} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={defaults.email} />
      </Field>
      <Field label="Address" htmlFor="address">
        <Textarea id="address" name="address" defaultValue={defaults.address} />
      </Field>
      <Field label="Reservation payment percent" htmlFor="reservationPaymentPercent">
        <Input
          id="reservationPaymentPercent"
          name="reservationPaymentPercent"
          type="number"
          min={1}
          max={100}
          defaultValue={defaults.reservationPaymentPercent}
        />
      </Field>
      <input type="hidden" name="balanceDueHours" value={defaults.balanceDueHours} />
      <Field label="Minimum rental hours" htmlFor="minimumRentalHours">
        <Input
          id="minimumRentalHours"
          name="minimumRentalHours"
          type="number"
          min={1}
          defaultValue={defaults.minimumRentalHours}
        />
      </Field>
      <Field label="Hold duration (minutes)" htmlFor="holdDurationMinutes">
        <Input
          id="holdDurationMinutes"
          name="holdDurationMinutes"
          type="number"
          min={1}
          defaultValue={defaults.holdDurationMinutes}
        />
      </Field>
      <Field label="Quote duration (minutes)" htmlFor="quoteDurationMinutes">
        <Input
          id="quoteDurationMinutes"
          name="quoteDurationMinutes"
          type="number"
          min={1}
          defaultValue={defaults.quoteDurationMinutes}
        />
      </Field>
      <Field label="Facebook URL" htmlFor="facebook">
        <Input id="facebook" name="facebook" defaultValue={defaults.socialLinks.facebook ?? ""} />
      </Field>
      <Field label="Instagram URL" htmlFor="instagram">
        <Input id="instagram" name="instagram" defaultValue={defaults.socialLinks.instagram ?? ""} />
      </Field>
      <Field label="X URL" htmlFor="x">
        <Input id="x" name="x" defaultValue={defaults.socialLinks.x ?? ""} />
      </Field>
      <Field label="LinkedIn URL" htmlFor="linkedin">
        <Input
          id="linkedin"
          name="linkedin"
          defaultValue={defaults.socialLinks.linkedin ?? ""}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
