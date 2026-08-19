"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { CustomFieldsEditor } from "@/components/admin/fleet/custom-fields-editor";
import { VehicleDataLookup } from "@/components/admin/fleet/vehicle-data-lookup";
import { VehicleImageImport } from "@/components/admin/fleet/vehicle-image-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { slugify } from "@/lib/fleet/slug";
import type {
  VehicleImportDuplicate,
  VehicleImportImage,
  VehicleImportPayload,
} from "@/lib/vehicle-data/import-payload";
import { kwToHp } from "@/lib/vehicle-data/normalize";
import type { VehicleCustomField } from "@/lib/validation/vehicle-custom-fields";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type ModelValues = {
  vehicleClassId: string;
  make: string;
  model: string;
  slug: string;
  yearFrom: number | null;
  yearTo: number | null;
  description: string;
  seats: number;
  doors: number;
  transmission: "automatic" | "manual";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  luggage: number;
  airConditioning: boolean;
  featured: boolean;
  published: boolean;
  usdDailyRateFrom?: number | null;
  usdDailyRateTo?: number | null;
  generation?: string | null;
  trimLevel?: string | null;
  bodyType?: string | null;
  engineName?: string | null;
  engineDisplacementL?: number | null;
  cylinders?: number | null;
  powerKw?: number | null;
  torqueNm?: number | null;
  driveType?: string | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  wheelbaseMm?: number | null;
  fuelEconomyLPer100Km?: number | null;
  batteryCapacityKwh?: number | null;
  usableBatteryKwh?: number | null;
  evRangeKm?: number | null;
  acChargingKw?: number | null;
  dcChargingKw?: number | null;
  customFields?: VehicleCustomField[] | null;
  externalProvider?: string | null;
  externalVehicleId?: string | null;
  externalImportedAt?: Date | string | null;
};

/** Every text/number input is held as a string so blank stays blank. */
type FieldState = Record<TextFieldName, string>;

type TextFieldName =
  | "vehicleClassId"
  | "make"
  | "model"
  | "slug"
  | "description"
  | "yearFrom"
  | "yearTo"
  | "seats"
  | "doors"
  | "luggage"
  | "transmission"
  | "fuelType"
  | "generation"
  | "trimLevel"
  | "bodyType"
  | "engineName"
  | "engineDisplacementL"
  | "cylinders"
  | "powerKw"
  | "torqueNm"
  | "driveType"
  | "lengthMm"
  | "widthMm"
  | "heightMm"
  | "wheelbaseMm"
  | "fuelEconomyLPer100Km"
  | "batteryCapacityKwh"
  | "usableBatteryKwh"
  | "evRangeKm"
  | "acChargingKw"
  | "dcChargingKw";

function text(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function formatImportedAt(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function initialFields(defaults?: ModelValues): FieldState {
  return {
    vehicleClassId: text(defaults?.vehicleClassId),
    make: text(defaults?.make),
    model: text(defaults?.model),
    slug: text(defaults?.slug),
    description: text(defaults?.description),
    yearFrom: text(defaults?.yearFrom),
    yearTo: text(defaults?.yearTo),
    seats: text(defaults?.seats ?? 5),
    doors: text(defaults?.doors ?? 4),
    luggage: text(defaults?.luggage ?? 2),
    transmission: defaults?.transmission ?? "automatic",
    fuelType: defaults?.fuelType ?? "petrol",
    generation: text(defaults?.generation),
    trimLevel: text(defaults?.trimLevel),
    bodyType: text(defaults?.bodyType),
    engineName: text(defaults?.engineName),
    engineDisplacementL: text(defaults?.engineDisplacementL),
    cylinders: text(defaults?.cylinders),
    powerKw: text(defaults?.powerKw),
    torqueNm: text(defaults?.torqueNm),
    driveType: text(defaults?.driveType),
    lengthMm: text(defaults?.lengthMm),
    widthMm: text(defaults?.widthMm),
    heightMm: text(defaults?.heightMm),
    wheelbaseMm: text(defaults?.wheelbaseMm),
    fuelEconomyLPer100Km: text(defaults?.fuelEconomyLPer100Km),
    batteryCapacityKwh: text(defaults?.batteryCapacityKwh),
    usableBatteryKwh: text(defaults?.usableBatteryKwh),
    evRangeKm: text(defaults?.evRangeKm),
    acChargingKw: text(defaults?.acChargingKw),
    dcChargingKw: text(defaults?.dcChargingKw),
  };
}

export function VehicleModelForm({
  action,
  classes,
  defaults,
  contentOnly = false,
  lockedSlug = false,
  submitLabel,
  lookupEnabled = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  classes: { id: string; name: string }[];
  defaults?: ModelValues;
  contentOnly?: boolean;
  lockedSlug?: boolean;
  submitLabel: string;
  /** True only where provider lookup is offered and configured. */
  lookupEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [fields, setFields] = useState<FieldState>(() => initialFields(defaults));
  const [customFields, setCustomFields] = useState<VehicleCustomField[]>(
    () => defaults?.customFields ?? [],
  );
  const [provenance, setProvenance] = useState<{
    provider: string;
    providerId: string;
    label: string;
    importedAt: string | null;
  } | null>(() =>
    defaults?.externalProvider && defaults?.externalVehicleId
      ? {
          provider: defaults.externalProvider,
          providerId: defaults.externalVehicleId,
          label: `${defaults.make} ${defaults.model}`,
          importedAt: formatImportedAt(defaults.externalImportedAt),
        }
      : null,
  );
  const [importImages, setImportImages] = useState<VehicleImportImage[]>([]);
  const [imageImportEnabled, setImageImportEnabled] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<VehicleImportDuplicate[]>([]);
  const [duplicatesDismissed, setDuplicatesDismissed] = useState(false);

  function setField(name: TextFieldName, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function handleImport(payload: VehicleImportPayload) {
    const imported = payload.fields;

    setFields((current) => ({
      ...current,
      // Catalogue identity and specifications come from the provider.
      make: imported.make || current.make,
      model: imported.model || current.model,
      slug:
        lockedSlug || defaults?.published
          ? current.slug
          : slugify(`${imported.make} ${imported.model}`),
      yearFrom: text(imported.yearFrom),
      yearTo: text(imported.yearTo),
      generation: text(imported.generation),
      trimLevel: text(imported.trimLevel),
      bodyType: text(imported.bodyType),
      engineName: text(imported.engineName),
      engineDisplacementL: text(imported.engineDisplacementL),
      cylinders: text(imported.cylinders),
      powerKw: text(imported.powerKw),
      torqueNm: text(imported.torqueNm),
      driveType: text(imported.driveType),
      lengthMm: text(imported.lengthMm),
      widthMm: text(imported.widthMm),
      heightMm: text(imported.heightMm),
      wheelbaseMm: text(imported.wheelbaseMm),
      fuelEconomyLPer100Km: text(imported.fuelEconomyLPer100Km),
      batteryCapacityKwh: text(imported.batteryCapacityKwh),
      usableBatteryKwh: text(imported.usableBatteryKwh),
      evRangeKm: text(imported.evRangeKm),
      acChargingKw: text(imported.acChargingKw),
      dcChargingKw: text(imported.dcChargingKw),
      // Keep the existing figure when the provider does not supply one.
      seats: imported.seats === null ? current.seats : String(imported.seats),
      doors: imported.doors === null ? current.doors : String(imported.doors),
      transmission: imported.transmission ?? current.transmission,
      fuelType: imported.fuelType ?? current.fuelType,
      // Class, GHS rate, deposit, USD catalogue rate, description, luggage,
      // published and featured stay exactly as staff left them.
    }));

    setProvenance({
      provider: payload.provider,
      providerId: payload.providerId,
      label: payload.label,
      importedAt: null,
    });
    setImportImages(payload.images);
    setImageImportEnabled(payload.imageImportEnabled);
    setSelectedImageIds([]);
    setPrimaryImageId(null);
    setDuplicates(payload.duplicates);
    setDuplicatesDismissed(false);
  }

  function clearProvenance() {
    setProvenance(null);
    setImportImages([]);
    setSelectedImageIds([]);
    setPrimaryImageId(null);
    setDuplicates([]);
  }

  const disabled = contentOnly;
  const showEv =
    fields.fuelType === "electric" ||
    fields.fuelType === "hybrid" ||
    Boolean(
      fields.batteryCapacityKwh ||
        fields.usableBatteryKwh ||
        fields.evRangeKm ||
        fields.acChargingKw ||
        fields.dcChargingKw,
    );

  const powerKwNumber = Number.parseFloat(fields.powerKw);
  const powerHint = Number.isFinite(powerKwNumber)
    ? `≈ ${kwToHp(powerKwNumber)} hp`
    : undefined;

  return (
    <form action={formAction} className="max-w-4xl space-y-8" aria-busy={pending}>
      {state?.error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}

      {lookupEnabled && !contentOnly ? (
        <section className="space-y-3" aria-labelledby="lookup-heading">
          <h2 id="lookup-heading" className="text-lg font-medium">
            Vehicle database lookup
          </h2>
          <VehicleDataLookup onImport={handleImport} />
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or enter vehicle manually
            <span className="h-px flex-1 bg-border" />
          </div>
        </section>
      ) : null}
      {!lookupEnabled && !contentOnly && !defaults ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Vehicle database lookup is not configured on this deployment. Enter
          the vehicle manually.
        </p>
      ) : null}

      {provenance ? (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <p>
            <span className="font-medium">Imported from CarDatabase:</span>{" "}
            {provenance.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {`External record: ${provenance.providerId}.`}
            {provenance.importedAt
              ? ` Last imported: ${provenance.importedAt}.`
              : ""}
            {" These values are editable and are stored in Nii Plants."}
          </p>
          {!contentOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={clearProvenance}
            >
              Remove database link
            </Button>
          ) : null}
        </div>
      ) : null}

      {duplicates.length > 0 && !duplicatesDismissed ? (
        <div
          role="alert"
          className="space-y-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
        >
          <p className="font-medium">A similar vehicle model already exists.</p>
          <ul className="list-disc space-y-1 pl-5">
            {duplicates.map((duplicate) => (
              <li key={duplicate.id}>
                <Link
                  href={`/admin/fleet/models/${duplicate.id}`}
                  className="underline underline-offset-2"
                  target="_blank"
                >
                  {`Open ${duplicate.make} ${duplicate.model}${duplicate.yearFrom ? ` (${duplicate.yearFrom})` : ""}`}
                </Link>
                {duplicate.published ? " — published" : " — unpublished"}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDuplicatesDismissed(true)}
          >
            Continue anyway
          </Button>
        </div>
      ) : null}

      <input
        type="hidden"
        name="externalProvider"
        value={provenance?.provider ?? ""}
        readOnly
      />
      <input
        type="hidden"
        name="externalVehicleId"
        value={provenance?.providerId ?? ""}
        readOnly
      />

      <Section title="Basic information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Make" htmlFor="make">
            <Input
              id="make"
              name="make"
              required={!contentOnly}
              disabled={disabled}
              value={fields.make}
              onChange={(event) => {
                const nextMake = event.target.value;
                setFields((current) => ({
                  ...current,
                  make: nextMake,
                  slug:
                    lockedSlug || defaults?.published
                      ? current.slug
                      : slugify(`${nextMake} ${current.model}`),
                }));
              }}
            />
          </Field>
          <Field label="Model" htmlFor="model">
            <Input
              id="model"
              name="model"
              required={!contentOnly}
              disabled={disabled}
              value={fields.model}
              onChange={(event) => {
                const nextModel = event.target.value;
                setFields((current) => ({
                  ...current,
                  model: nextModel,
                  slug:
                    lockedSlug || defaults?.published
                      ? current.slug
                      : slugify(`${current.make} ${nextModel}`),
                }));
              }}
            />
          </Field>
        </div>
        <Field label="Public slug" htmlFor="slug">
          <Input
            id="slug"
            name="slug"
            value={fields.slug}
            readOnly={lockedSlug || contentOnly}
            onChange={(event) => setField("slug", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Year from" htmlFor="yearFrom">
            <Input
              id="yearFrom"
              name="yearFrom"
              type="number"
              disabled={disabled}
              value={fields.yearFrom}
              onChange={(event) => setField("yearFrom", event.target.value)}
            />
          </Field>
          <Field label="Year to" htmlFor="yearTo">
            <Input
              id="yearTo"
              name="yearTo"
              type="number"
              disabled={disabled}
              value={fields.yearTo}
              onChange={(event) => setField("yearTo", event.target.value)}
            />
          </Field>
          <Field label="Generation" htmlFor="generation">
            <Input
              id="generation"
              name="generation"
              disabled={disabled}
              value={fields.generation}
              onChange={(event) => setField("generation", event.target.value)}
            />
          </Field>
          <Field label="Trim" htmlFor="trimLevel">
            <Input
              id="trimLevel"
              name="trimLevel"
              disabled={disabled}
              value={fields.trimLevel}
              onChange={(event) => setField("trimLevel", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Body type" htmlFor="bodyType">
          <Input
            id="bodyType"
            name="bodyType"
            disabled={disabled}
            placeholder="Sedan"
            value={fields.bodyType}
            onChange={(event) => setField("bodyType", event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Powertrain">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Engine" htmlFor="engineName">
            <Input
              id="engineName"
              name="engineName"
              disabled={disabled}
              placeholder="1.8 L 4-cylinder"
              value={fields.engineName}
              onChange={(event) => setField("engineName", event.target.value)}
            />
          </Field>
          <Field label="Fuel type" htmlFor="fuelType">
            <select
              id="fuelType"
              name="fuelType"
              disabled={disabled}
              className={selectClassName}
              value={fields.fuelType}
              onChange={(event) => setField("fuelType", event.target.value)}
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Displacement (L)" htmlFor="engineDisplacementL">
            <Input
              id="engineDisplacementL"
              name="engineDisplacementL"
              type="number"
              step="0.1"
              disabled={disabled}
              value={fields.engineDisplacementL}
              onChange={(event) =>
                setField("engineDisplacementL", event.target.value)
              }
            />
          </Field>
          <Field label="Cylinders" htmlFor="cylinders">
            <Input
              id="cylinders"
              name="cylinders"
              type="number"
              disabled={disabled}
              value={fields.cylinders}
              onChange={(event) => setField("cylinders", event.target.value)}
            />
          </Field>
          <Field label="Power (kW)" htmlFor="powerKw" hint={powerHint}>
            <Input
              id="powerKw"
              name="powerKw"
              type="number"
              step="0.1"
              disabled={disabled}
              value={fields.powerKw}
              onChange={(event) => setField("powerKw", event.target.value)}
            />
          </Field>
          <Field label="Torque (Nm)" htmlFor="torqueNm">
            <Input
              id="torqueNm"
              name="torqueNm"
              type="number"
              disabled={disabled}
              value={fields.torqueNm}
              onChange={(event) => setField("torqueNm", event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Transmission" htmlFor="transmission">
            <select
              id="transmission"
              name="transmission"
              disabled={disabled}
              className={selectClassName}
              value={fields.transmission}
              onChange={(event) => setField("transmission", event.target.value)}
            >
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </Field>
          <Field label="Drive type" htmlFor="driveType">
            <Input
              id="driveType"
              name="driveType"
              disabled={disabled}
              placeholder="FWD"
              value={fields.driveType}
              onChange={(event) => setField("driveType", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Fuel economy (L/100 km)" htmlFor="fuelEconomyLPer100Km">
          <Input
            id="fuelEconomyLPer100Km"
            name="fuelEconomyLPer100Km"
            type="number"
            step="0.1"
            disabled={disabled}
            value={fields.fuelEconomyLPer100Km}
            onChange={(event) =>
              setField("fuelEconomyLPer100Km", event.target.value)
            }
          />
        </Field>
      </Section>

      <Section title="Capacity">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Seats" htmlFor="seats">
            <Input
              id="seats"
              name="seats"
              type="number"
              min={1}
              disabled={disabled}
              value={fields.seats}
              onChange={(event) => setField("seats", event.target.value)}
            />
          </Field>
          <Field label="Doors" htmlFor="doors">
            <Input
              id="doors"
              name="doors"
              type="number"
              min={1}
              disabled={disabled}
              value={fields.doors}
              onChange={(event) => setField("doors", event.target.value)}
            />
          </Field>
          <Field
            label="Luggage"
            htmlFor="luggage"
            hint="Nii Plants rental figure. Not imported."
          >
            <Input
              id="luggage"
              name="luggage"
              type="number"
              min={0}
              disabled={disabled}
              value={fields.luggage}
              onChange={(event) => setField("luggage", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Dimensions">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Length (mm)" htmlFor="lengthMm">
            <Input
              id="lengthMm"
              name="lengthMm"
              type="number"
              disabled={disabled}
              value={fields.lengthMm}
              onChange={(event) => setField("lengthMm", event.target.value)}
            />
          </Field>
          <Field label="Width (mm)" htmlFor="widthMm">
            <Input
              id="widthMm"
              name="widthMm"
              type="number"
              disabled={disabled}
              value={fields.widthMm}
              onChange={(event) => setField("widthMm", event.target.value)}
            />
          </Field>
          <Field label="Height (mm)" htmlFor="heightMm">
            <Input
              id="heightMm"
              name="heightMm"
              type="number"
              disabled={disabled}
              value={fields.heightMm}
              onChange={(event) => setField("heightMm", event.target.value)}
            />
          </Field>
          <Field label="Wheelbase (mm)" htmlFor="wheelbaseMm">
            <Input
              id="wheelbaseMm"
              name="wheelbaseMm"
              type="number"
              disabled={disabled}
              value={fields.wheelbaseMm}
              onChange={(event) => setField("wheelbaseMm", event.target.value)}
            />
          </Field>
        </div>
      </Section>

      {showEv ? (
        <Section title="EV details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Battery capacity (kWh)" htmlFor="batteryCapacityKwh">
              <Input
                id="batteryCapacityKwh"
                name="batteryCapacityKwh"
                type="number"
                step="0.1"
                disabled={disabled}
                value={fields.batteryCapacityKwh}
                onChange={(event) =>
                  setField("batteryCapacityKwh", event.target.value)
                }
              />
            </Field>
            <Field label="Usable battery (kWh)" htmlFor="usableBatteryKwh">
              <Input
                id="usableBatteryKwh"
                name="usableBatteryKwh"
                type="number"
                step="0.1"
                disabled={disabled}
                value={fields.usableBatteryKwh}
                onChange={(event) =>
                  setField("usableBatteryKwh", event.target.value)
                }
              />
            </Field>
            <Field label="Range (km)" htmlFor="evRangeKm">
              <Input
                id="evRangeKm"
                name="evRangeKm"
                type="number"
                disabled={disabled}
                value={fields.evRangeKm}
                onChange={(event) => setField("evRangeKm", event.target.value)}
              />
            </Field>
            <Field label="AC charging (kW)" htmlFor="acChargingKw">
              <Input
                id="acChargingKw"
                name="acChargingKw"
                type="number"
                step="0.1"
                disabled={disabled}
                value={fields.acChargingKw}
                onChange={(event) => setField("acChargingKw", event.target.value)}
              />
            </Field>
            <Field label="DC charging (kW)" htmlFor="dcChargingKw">
              <Input
                id="dcChargingKw"
                name="dcChargingKw"
                type="number"
                step="0.1"
                disabled={disabled}
                value={fields.dcChargingKw}
                onChange={(event) => setField("dcChargingKw", event.target.value)}
              />
            </Field>
          </div>
        </Section>
      ) : null}

      <Section title="Rental details">
        <Field label="Vehicle class" htmlFor="vehicleClassId">
          <select
            id="vehicleClassId"
            name="vehicleClassId"
            required={!contentOnly}
            disabled={disabled}
            className={selectClassName}
            value={fields.vehicleClassId}
            onChange={(event) => setField("vehicleClassId", event.target.value)}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-sm text-muted-foreground">
          GHS daily rate and refundable security deposit come from the vehicle
          class. Published USD can be set on this model when it differs from the
          class band. A vehicle database import never changes rates. Edit every
          class and model from the{" "}
          <Link
            href="/admin/rates"
            className="text-accent underline-offset-2 hover:underline"
          >
            rates workbook
          </Link>
          .
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Published USD / day from" htmlFor="usdDailyRateFrom">
            <Input
              id="usdDailyRateFrom"
              name="usdDailyRateFrom"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              disabled={disabled}
              defaultValue={defaults?.usdDailyRateFrom ?? ""}
            />
          </Field>
          <Field label="Published USD / day to" htmlFor="usdDailyRateTo">
            <Input
              id="usdDailyRateTo"
              name="usdDailyRateTo"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              disabled={disabled}
              defaultValue={defaults?.usdDailyRateTo ?? ""}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="airConditioning"
              defaultChecked={defaults?.airConditioning ?? true}
              disabled={disabled}
            />
            Air conditioning
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={defaults?.featured ?? false}
            />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={defaults?.published ?? false}
            />
            Published
          </label>
        </div>
      </Section>

      <CustomFieldsEditor
        fields={customFields}
        onChange={setCustomFields}
        disabled={contentOnly}
      />

      {importImages.length > 0 ? (
        <VehicleImageImport
          images={importImages}
          enabled={imageImportEnabled}
          selectedIds={selectedImageIds}
          primaryId={primaryImageId}
          providerLabel="CarDatabase"
          onChange={(next) => {
            setSelectedImageIds(next.selectedIds);
            setPrimaryImageId(next.primaryId);
          }}
        />
      ) : null}

      <Section title="Description">
        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            required
            value={fields.description}
            onChange={(event) => setField("description", event.target.value)}
          />
        </Field>
      </Section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const headingId = `section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className="space-y-4" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg font-medium">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
