"use client";

import { useActionState, useMemo, useState } from "react";

import { QuoteReview } from "@/components/booking/quote-review";
import { DeskPanel } from "@/components/marketing/desk-panel";
import { PageEyebrow } from "@/components/marketing/page-intro";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyPromoAction, createQuoteAction } from "@/lib/booking/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { formatGhs } from "@/lib/money";
import type { PromotionRecord } from "@/lib/pricing/apply-promotion";
import { calculateBookingPrice } from "@/lib/pricing/calculate-booking-price";
import type { ExtraCatalogItem } from "@/lib/pricing/calculate-extras";
import type { AvailabilitySearchInput } from "@/lib/validation/availability";
import { cn } from "@/lib/utils";

export function ExtrasAndQuoteForm({
  search,
  modelSlug,
  modelName,
  className,
  dailyRate,
  securityDepositRequired,
  reservationPaymentPercent,
  extras,
  error,
}: {
  search: AvailabilitySearchInput & { pickupAt: string; returnAt: string };
  modelSlug: string;
  modelName: string;
  className: string;
  dailyRate: number;
  securityDepositRequired: number;
  reservationPaymentPercent: number;
  extras: ExtraCatalogItem[];
  error?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createQuoteAction,
    null as ActionState,
  );
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState("");
  const [promoPending, setPromoPending] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoOk, setPromoOk] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<Pick<
    PromotionRecord,
    "id" | "code" | "type" | "value"
  > | null>(null);

  const extraSelections = useMemo(
    () =>
      Object.entries(selected).map(([extraId, quantity]) => ({
        extraId,
        quantity,
      })),
    [selected],
  );

  const preview = useMemo(() => {
    try {
      return calculateBookingPrice({
        pickupAt: new Date(search.pickupAt),
        returnAt: new Date(search.returnAt),
        dailyRate,
        securityDepositRequired,
        reservationPaymentPercent,
        extraCatalog: extras,
        extraSelections,
        promotion: appliedPromo
          ? {
              ...appliedPromo,
              active: true,
              startsAt: new Date(0),
              endsAt: new Date("9999-12-31T00:00:00Z"),
              maxUses: null,
              usageCount: 0,
            }
          : null,
      });
    } catch {
      return null;
    }
  }, [
    appliedPromo,
    dailyRate,
    extraSelections,
    extras,
    reservationPaymentPercent,
    search.pickupAt,
    search.returnAt,
    securityDepositRequired,
  ]);

  async function onApplyPromo() {
    setPromoPending(true);
    try {
      const result = await applyPromoAction(
        (() => {
          const data = new FormData();
          data.set("promoCode", promoCode);
          return data;
        })(),
      );
      setPromoOk(result.ok);
      setPromoMessage(result.message);
      setAppliedPromo(result.ok && result.promotion ? result.promotion : null);
    } finally {
      setPromoPending(false);
    }
  }

  const message = state?.error ?? error;

  return (
    <form
      action={formAction}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      aria-busy={pending}
    >
      <input type="hidden" name="pickup" value={search.pickupLocation} />
      <input type="hidden" name="return" value={search.returnLocation} />
      <input type="hidden" name="pickupDate" value={search.pickupDate} />
      <input type="hidden" name="pickupTime" value={search.pickupTime} />
      <input type="hidden" name="returnDate" value={search.returnDate} />
      <input type="hidden" name="returnTime" value={search.returnTime} />
      <input type="hidden" name="modelSlug" value={modelSlug} />

      <div className="space-y-6">
        <header>
          <PageEyebrow>{className}</PageEyebrow>
          <h1 className="mt-2 font-heading text-4xl tracking-tight">{modelName}</h1>
          <p className="mt-2 text-muted-foreground">or similar</p>
        </header>

        {message ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="font-heading text-xl">
            <span className="mb-3 block h-0.5 w-8 bg-accent" aria-hidden />
            Extras
          </legend>
          {extras.length === 0 ? (
            <p className="text-sm text-muted-foreground">No extras are configured.</p>
          ) : (
            extras.map((extra) => {
              const checked = extra.id in selected;
              return (
                <label
                  key={extra.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-border transition-[box-shadow,ring-color,background-color] duration-200 hover:ring-primary/40 sm:flex-row sm:items-center sm:justify-between",
                    checked && "bg-primary/5 ring-primary/30",
                  )}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="extraId"
                      value={extra.id}
                      checked={checked}
                      onChange={(event) => {
                        setSelected((current) => {
                          const next = { ...current };
                          if (event.target.checked) {
                            next[extra.id] = current[extra.id] ?? 1;
                          } else {
                            delete next[extra.id];
                          }
                          return next;
                        });
                      }}
                      className="mt-1 size-4"
                    />
                    <span>
                      <span className="block font-medium">{extra.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        {extra.description}
                      </span>
                      <span className="mt-1 block text-sm">
                        {formatGhs(extra.price)}
                        {extra.pricingType === "per_day" ? "/day" : " once"}
                      </span>
                    </span>
                  </span>
                  {checked ? (
                    <span className="sm:w-24">
                      <Label htmlFor={`quantity-${extra.id}`} className="sr-only">
                        Quantity for {extra.name}
                      </Label>
                      <Input
                        id={`quantity-${extra.id}`}
                        name={`quantity-${extra.id}`}
                        type="number"
                        min={1}
                        max={10}
                        value={selected[extra.id] ?? 1}
                        className="h-11"
                        onChange={(event) => {
                          const quantity = Number(event.target.value);
                          setSelected((current) => ({
                            ...current,
                            [extra.id]: quantity,
                          }));
                        }}
                      />
                    </span>
                  ) : null}
                </label>
              );
            })
          )}
        </fieldset>

        <DeskPanel>
          <Label htmlFor="promoCode">Promo code</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="promoCode"
              name="promoCode"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              autoComplete="off"
              className="h-11"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 px-4"
              onClick={onApplyPromo}
              disabled={promoPending || !promoCode.trim()}
              aria-busy={promoPending}
            >
              {promoPending ? "Applying…" : "Apply"}
            </Button>
          </div>
          {promoMessage ? (
            <p
              role="status"
              className={`mt-2 text-sm ${promoOk ? "text-success" : "text-destructive"}`}
            >
              {promoMessage}
            </p>
          ) : null}
        </DeskPanel>
      </div>

      <aside
        className="order-first space-y-4 lg:order-last lg:sticky lg:top-24 lg:self-start"
        aria-label="Quote summary and next step"
      >
        {preview ? <QuoteReview price={preview} live /> : null}
        <p className="text-xs text-muted-foreground">
          Preview only. The server recalculates the final quote before it is secured.
        </p>
        <Button type="submit" className="h-11 w-full transition-all duration-300" size="lg" disabled={pending}>
          {pending ? (
            <span className="flex items-center gap-2">
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Securing quote…
            </span>
          ) : "Secure this quote"}
        </Button>
      </aside>
    </form>
  );
}
