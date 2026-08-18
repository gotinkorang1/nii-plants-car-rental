"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EnquiryServiceType } from "@/lib/enquiries/status";
import { enquiryServiceLabel } from "@/lib/enquiries/status";

type VehicleClassOption = { id: string; name: string };

type EnquiryFormProps = {
  serviceType: EnquiryServiceType;
  vehicleClasses?: VehicleClassOption[];
  submitLabel?: string;
};

export function EnquiryForm({
  serviceType,
  vehicleClasses = [],
  submitLabel,
}: EnquiryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, unknown> = {
      serviceType,
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      email: data.get("email"),
      phone: data.get("phone"),
      preferredContactMethod: data.get("preferredContactMethod") || undefined,
      customerMessage: data.get("customerMessage") || undefined,
      companyWebsite: data.get("companyWebsite") || undefined,
      pickupLocationText: data.get("pickupLocationText") || undefined,
      returnLocationText: data.get("returnLocationText") || undefined,
      pickupAt: data.get("pickupAt") || undefined,
      returnAt: data.get("returnAt") || undefined,
      passengerCount: data.get("passengerCount") || undefined,
      vehicleClassId: data.get("vehicleClassId") || undefined,
      companyName: data.get("companyName") || undefined,
    };

    const serviceDetails: Record<string, unknown> = {};
    if (serviceType === "airport_transfer") {
      serviceDetails.transferDirection = data.get("transferDirection");
      serviceDetails.flightNumber = data.get("flightNumber") || undefined;
      serviceDetails.luggageNotes = data.get("luggageNotes") || undefined;
    }
    if (serviceType === "long_term") {
      serviceDetails.intendedUse = data.get("intendedUse") || undefined;
      serviceDetails.rentalPeriod = data.get("rentalPeriod") || undefined;
    }
    if (serviceType === "corporate") {
      serviceDetails.serviceRequirement = data.get("serviceRequirement");
      serviceDetails.estimatedTravellers = data.get("estimatedTravellers") || undefined;
    }
    if (serviceType === "events") {
      serviceDetails.eventType = data.get("eventType");
      serviceDetails.vehicleCount = data.get("vehicleCount") || undefined;
    }
    if (serviceType === "multi_city") {
      serviceDetails.destinations = data.get("destinations");
    }
    if (Object.keys(serviceDetails).length > 0) {
      payload.serviceDetails = serviceDetails;
    }

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        reference?: string;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.reference) {
        setError(
          result.error ??
            "We couldn't send your request. Please try again or contact us directly.",
        );
        setPending(false);
        return;
      }

      router.push(`/enquiry/complete/${encodeURIComponent(result.reference)}`);
    } catch {
      setError("We couldn't send your request. Please try again or contact us directly.");
      setPending(false);
    }
  }

  const label = submitLabel ?? `Request ${enquiryServiceLabel(serviceType)}`;

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl bg-card p-5 ring-1 ring-border">
      <input
        type="text"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <fieldset className="space-y-4">
        <legend className="font-heading text-lg">Your details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" name="firstName" label="First name" autoComplete="given-name" required />
          <Field id="lastName" name="lastName" label="Last name" autoComplete="family-name" required />
          <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
          <Field id="phone" name="phone" type="tel" label="Phone" autoComplete="tel" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredContactMethod">Preferred contact method</Label>
          <select
            id="preferredContactMethod"
            name="preferredContactMethod"
            defaultValue="email"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
      </fieldset>

      {serviceType === "corporate" ? (
        <Field id="companyName" name="companyName" label="Company name" required />
      ) : null}

      <ServiceFields serviceType={serviceType} vehicleClasses={vehicleClasses} />

      <div className="space-y-1.5">
        <Label htmlFor="customerMessage">Message / special request</Label>
        <Textarea
          id="customerMessage"
          name="customerMessage"
          rows={4}
          placeholder="Tell us anything else we should know."
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Sending request..." : label}
      </Button>
    </form>
  );
}

function ServiceFields({
  serviceType,
  vehicleClasses,
}: {
  serviceType: EnquiryServiceType;
  vehicleClasses: VehicleClassOption[];
}) {
  switch (serviceType) {
    case "chauffeur":
      return (
        <>
          <Field id="pickupLocationText" name="pickupLocationText" label="Pickup location" required />
          <Field id="returnLocationText" name="returnLocationText" label="Destination" required />
          <DateFields requirePickup requireReturn={false} />
          <Field id="passengerCount" name="passengerCount" type="number" label="Passenger count" min={1} max={500} required />
          <VehicleClassSelect vehicleClasses={vehicleClasses} />
        </>
      );
    case "airport_transfer":
      return (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="transferDirection">Transfer direction</Label>
            <select
              id="transferDirection"
              name="transferDirection"
              required
              defaultValue="airport_to_destination"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="airport_to_destination">Airport to destination</option>
              <option value="destination_to_airport">Destination to airport</option>
            </select>
          </div>
          <Field id="pickupLocationText" name="pickupLocationText" label="Pickup / destination" required />
          <Field id="flightNumber" name="flightNumber" label="Flight number (optional)" />
          <DateFields requirePickup label="Arrival or departure date/time" />
          <Field id="passengerCount" name="passengerCount" type="number" label="Passenger count" min={1} max={500} required />
          <Field id="luggageNotes" name="luggageNotes" label="Luggage notes (optional)" />
          <VehicleClassSelect vehicleClasses={vehicleClasses} />
        </>
      );
    case "long_term":
      return (
        <>
          <DateFields requirePickup label="Desired start date/time" />
          <Field id="returnAt" name="returnAt" type="datetime-local" label="Approximate end date/time" />
          <Field id="rentalPeriod" name="rentalPeriod" label="Rental period (optional)" placeholder="e.g. 3 months" />
          <Field id="intendedUse" name="intendedUse" label="Intended general use" />
          <VehicleClassSelect vehicleClasses={vehicleClasses} required />
        </>
      );
    case "corporate":
      return (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="serviceRequirement">Service requirement</Label>
            <select
              id="serviceRequirement"
              name="serviceRequirement"
              required
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="corporate_transport">Corporate transport</option>
              <option value="airport_movement">Airport movement</option>
              <option value="executive_transport">Executive transport</option>
              <option value="long_term">Long-term</option>
              <option value="events">Events</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Field id="estimatedTravellers" name="estimatedTravellers" type="number" label="Estimated travellers/vehicles (optional)" min={1} max={500} />
          <Field id="pickupAt" name="pickupAt" type="datetime-local" label="Preferred start date (optional)" />
        </>
      );
    case "events":
      return (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="eventType">Event type</Label>
            <select
              id="eventType"
              name="eventType"
              required
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="wedding">Wedding</option>
              <option value="corporate_event">Corporate event</option>
              <option value="group_transport">Group transport</option>
              <option value="special_event">Special event</option>
              <option value="other">Other</option>
            </select>
          </div>
          <DateFields requirePickup label="Event date/time" />
          <Field id="pickupLocationText" name="pickupLocationText" label="Pickup location" required />
          <Field id="returnLocationText" name="returnLocationText" label="Destination / venue" required />
          <Field id="passengerCount" name="passengerCount" type="number" label="Passenger count" min={1} max={500} required />
          <Field id="vehicleCount" name="vehicleCount" type="number" label="Number of vehicles (optional)" min={1} max={50} />
          <VehicleClassSelect vehicleClasses={vehicleClasses} />
        </>
      );
    case "multi_city":
      return (
        <>
          <Field id="pickupLocationText" name="pickupLocationText" label="Starting location" required />
          <div className="space-y-1.5">
            <Label htmlFor="destinations">Destinations / route details</Label>
            <Textarea id="destinations" name="destinations" rows={3} required placeholder="List cities or stops." />
          </div>
          <DateFields requirePickup />
          <Field id="passengerCount" name="passengerCount" type="number" label="Passenger count (optional)" min={1} max={500} />
        </>
      );
    default:
      return null;
  }
}

function DateFields({
  requirePickup = false,
  requireReturn = false,
  label = "Pickup date/time",
}: {
  requirePickup?: boolean;
  requireReturn?: boolean;
  label?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        id="pickupAt"
        name="pickupAt"
        type="datetime-local"
        label={label}
        required={requirePickup}
      />
      {requireReturn ? (
        <Field id="returnAt" name="returnAt" type="datetime-local" label="Return date/time" required />
      ) : (
        <Field id="returnAt" name="returnAt" type="datetime-local" label="Return date/time (optional)" />
      )}
    </div>
  );
}

function VehicleClassSelect({
  vehicleClasses,
  required = false,
}: {
  vehicleClasses: VehicleClassOption[];
  required?: boolean;
}) {
  if (vehicleClasses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="vehicleClassId">Preferred vehicle class{required ? "" : " (optional)"}</Label>
      <select
        id="vehicleClassId"
        name="vehicleClassId"
        required={required}
        className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        defaultValue=""
      >
        {!required ? <option value="">No preference</option> : null}
        {vehicleClasses.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  min,
  max,
  placeholder,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}
