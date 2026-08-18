"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStaffEnquiryAction } from "@/lib/enquiries/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";
import {
  ENQUIRY_SERVICE_LABELS,
  ENQUIRY_SERVICE_TYPES,
} from "@/lib/enquiries/status";

export function StaffEnquiryForm({
  vehicleClasses,
}: {
  vehicleClasses: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    createStaffEnquiryAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-6 rounded-2xl bg-card p-6 ring-1 ring-border">
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="serviceType">Service</Label>
          <select
            id="serviceType"
            name="serviceType"
            required
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {ENQUIRY_SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {ENQUIRY_SERVICE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source">Source</Label>
          <select
            id="source"
            name="source"
            required
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="phone">Phone</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Field name="firstName" label="First name" required />
        <Field name="lastName" label="Last name" required />
        <Field name="email" label="Email" type="email" required />
        <Field name="phone" label="Phone" type="tel" required />
        <Field name="companyName" label="Company (optional)" />
        <Field name="pickupLocationText" label="Pickup (optional)" />
        <Field name="returnLocationText" label="Destination (optional)" />
        <Field name="pickupAt" label="Pickup date/time" type="datetime-local" />
        <Field name="returnAt" label="Return date/time" type="datetime-local" />
        <Field name="passengerCount" label="Passengers" type="number" min={1} max={500} />
        <div className="space-y-1.5">
          <Label htmlFor="vehicleClassId">Vehicle class</Label>
          <select
            id="vehicleClassId"
            name="vehicleClassId"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            defaultValue=""
          >
            <option value="">No preference</option>
            {vehicleClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customerMessage">Customer message</Label>
        <Textarea id="customerMessage" name="customerMessage" rows={4} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create enquiry"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} min={min} max={max} />
    </div>
  );
}
