"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  assignEnquiryAction,
  changeEnquiryStatusAction,
  saveEnquiryQuoteAction,
  updateEnquiryNotesAction,
} from "@/lib/enquiries/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { pesewasToGhsInput } from "@/lib/money";
import {
  enquiryServiceLabel,
  enquiryStatusLabel,
  type EnquiryStatus,
} from "@/lib/enquiries/status";
import { mailHref, telHref, whatsappHref } from "@/lib/settings/public-contact";

type Detail = {
  enquiry: {
    id: string;
    reference: string;
    serviceType: import("@/lib/enquiries/status").EnquiryServiceType;
    status: EnquiryStatus;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string | null;
    pickupLocationText: string | null;
    returnLocationText: string | null;
    pickupAt: Date | null;
    returnAt: Date | null;
    passengerCount: number | null;
    customerMessage: string | null;
    serviceDetails: Record<string, unknown>;
    quotedAmount: number | null;
    quoteNotes: string | null;
    quoteValidUntil: Date | null;
    assignedTo: string | null;
    internalNotes: string | null;
    createdAt: Date;
    contactedAt: Date | null;
    quotedAt: Date | null;
    acceptedAt: Date | null;
    closedAt: Date | null;
  };
  vehicleClassName: string | null;
  assigneeName: string | null;
  history: Array<{
    fromStatus: EnquiryStatus | null;
    toStatus: EnquiryStatus;
    createdAt: Date;
    reason: string | null;
  }>;
  staff: Array<{ id: string; displayName: string }>;
  canMutate: boolean;
  quoteExpired: boolean;
  whatsapp?: string;
};

const NEXT_ACTIONS: Partial<Record<EnquiryStatus, EnquiryStatus[]>> = {
  new: ["in_review", "contacted", "closed"],
  in_review: ["contacted", "quoted", "accepted", "declined", "closed"],
  contacted: ["awaiting_customer", "quoted", "accepted", "declined", "closed"],
  awaiting_customer: ["contacted", "quoted", "closed"],
  quoted: ["accepted", "declined", "closed"],
  accepted: ["closed"],
  declined: ["closed"],
};

export function EnquiryDetailPanel({ detail }: { detail: Detail }) {
  const { enquiry } = detail;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Section title="Customer">
          <p>
            {enquiry.firstName} {enquiry.lastName}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <a className="text-primary hover:underline" href={mailHref(enquiry.email)}>
              {enquiry.email}
            </a>
            <a className="text-primary hover:underline" href={telHref(enquiry.phone)}>
              {enquiry.phone}
            </a>
            {detail.whatsapp ? (
              <a className="text-primary hover:underline" href={whatsappHref(detail.whatsapp)}>
                WhatsApp
              </a>
            ) : null}
          </div>
          {enquiry.companyName ? (
            <p className="mt-2 text-sm text-muted-foreground">{enquiry.companyName}</p>
          ) : null}
        </Section>

        <Section title="Request">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Item label="Service" value={enquiryServiceLabel(enquiry.serviceType)} />
            <Item label="Status" value={enquiryStatusLabel(enquiry.status)} />
            {enquiry.pickupAt ? <Item label="Pickup time" value={enquiry.pickupAt.toLocaleString()} /> : null}
            {enquiry.returnAt ? <Item label="Return time" value={enquiry.returnAt.toLocaleString()} /> : null}
            {enquiry.pickupLocationText ? <Item label="Pickup" value={enquiry.pickupLocationText} /> : null}
            {enquiry.returnLocationText ? <Item label="Destination" value={enquiry.returnLocationText} /> : null}
            {enquiry.passengerCount ? <Item label="Passengers" value={String(enquiry.passengerCount)} /> : null}
            {detail.vehicleClassName ? <Item label="Vehicle preference" value={detail.vehicleClassName} /> : null}
          </dl>
          {Object.keys(enquiry.serviceDetails).length > 0 ? (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
              {JSON.stringify(enquiry.serviceDetails, null, 2)}
            </pre>
          ) : null}
          {enquiry.customerMessage ? (
            <p className="mt-4 text-sm whitespace-pre-wrap">{enquiry.customerMessage}</p>
          ) : null}
        </Section>

        {enquiry.status === "accepted" ? (
          <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
            Accepted — manual service fulfillment required. No vehicle or driver has been assigned
            automatically.
          </p>
        ) : null}

        {detail.canMutate ? (
          <>
            <QuoteSection enquiry={enquiry} quoteExpired={detail.quoteExpired} />
            <NotesSection enquiryId={enquiry.id} internalNotes={enquiry.internalNotes} />
          </>
        ) : null}
      </div>

      <div className="space-y-6">
        {detail.canMutate ? (
          <>
            <AssignSection
              enquiryId={enquiry.id}
              assignedTo={enquiry.assignedTo}
              staff={detail.staff}
            />
            <StatusSection enquiryId={enquiry.id} status={enquiry.status} />
          </>
        ) : null}

        <Section title="Timeline">
          <ul className="space-y-3 text-sm">
            <li>Created — {enquiry.createdAt.toLocaleString()}</li>
            {detail.history.map((item, index) => (
              <li key={`${item.toStatus}-${index}`}>
                {item.fromStatus ? `${enquiryStatusLabel(item.fromStatus)} → ` : ""}
                {enquiryStatusLabel(item.toStatus)} — {item.createdAt.toLocaleString()}
                {item.reason ? ` (${item.reason})` : ""}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h2 className="font-heading text-lg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AssignSection({
  enquiryId,
  assignedTo,
  staff,
}: {
  enquiryId: string;
  assignedTo: string | null;
  staff: Array<{ id: string; displayName: string }>;
}) {
  const [state, action, pending] = useActionState(assignEnquiryAction, null as ActionState);

  return (
    <Section title="Assignment">
      <form action={action} className="space-y-3">
        <input type="hidden" name="enquiryId" value={enquiryId} />
        <select
          name="assignedTo"
          defaultValue={assignedTo ?? ""}
          aria-label="Assigned staff"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Unassigned</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" size="sm" disabled={pending}>
          Save assignment
        </Button>
      </form>
    </Section>
  );
}

function StatusSection({ enquiryId, status }: { enquiryId: string; status: EnquiryStatus }) {
  const [state, action, pending] = useActionState(changeEnquiryStatusAction, null as ActionState);
  const options = NEXT_ACTIONS[status] ?? [];

  if (options.length === 0) {
    return null;
  }

  return (
    <Section title="Workflow">
      <form action={action} className="space-y-3">
        <input type="hidden" name="enquiryId" value={enquiryId} />
        <select
          name="toStatus"
          aria-label="Change status"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          defaultValue=""
          required
        >
          <option value="" disabled>
            Choose next status
          </option>
          {options.map((item) => (
            <option key={item} value={item}>
              {enquiryStatusLabel(item)}
            </option>
          ))}
        </select>
        <Textarea name="reason" rows={2} placeholder="Optional note" aria-label="Reason" />
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" size="sm" disabled={pending}>
          Update status
        </Button>
      </form>
    </Section>
  );
}

function QuoteSection({
  enquiry,
  quoteExpired,
}: {
  enquiry: Detail["enquiry"];
  quoteExpired: boolean;
}) {
  const [state, action, pending] = useActionState(saveEnquiryQuoteAction, null as ActionState);

  return (
    <Section title="Manual quote">
      {quoteExpired ? (
        <p className="mb-3 text-sm text-warning">Quote expired — staff may re-quote.</p>
      ) : null}
      <form action={action} className="space-y-3">
        <input type="hidden" name="enquiryId" value={enquiry.id} />
        <div className="space-y-1.5">
          <Label htmlFor="quotedAmountGhs">Quoted amount (GHS)</Label>
          <Input
            id="quotedAmountGhs"
            name="quotedAmountGhs"
            defaultValue={
              enquiry.quotedAmount !== null ? pesewasToGhsInput(enquiry.quotedAmount) : ""
            }
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quoteValidUntil">Valid until</Label>
          <Input
            id="quoteValidUntil"
            name="quoteValidUntil"
            type="datetime-local"
            defaultValue={
              enquiry.quoteValidUntil
                ? enquiry.quoteValidUntil.toISOString().slice(0, 16)
                : ""
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quoteNotes">Quote notes</Label>
          <Textarea id="quoteNotes" name="quoteNotes" rows={3} defaultValue={enquiry.quoteNotes ?? ""} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sendEmail" value="1" />
          Send quote email to customer
        </label>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          Save quote
        </Button>
      </form>
    </Section>
  );
}

function NotesSection({
  enquiryId,
  internalNotes,
}: {
  enquiryId: string;
  internalNotes: string | null;
}) {
  const [state, action, pending] = useActionState(updateEnquiryNotesAction, null as ActionState);

  return (
    <Section title="Internal notes">
      <form action={action} className="space-y-3">
        <input type="hidden" name="enquiryId" value={enquiryId} />
        <Textarea
          name="internalNotes"
          rows={4}
          defaultValue={internalNotes ?? ""}
          aria-label="Internal notes"
        />
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Save notes
        </Button>
      </form>
    </Section>
  );
}
