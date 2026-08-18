"use client";

import { useActionState, useMemo, useState } from "react";

import { QuoteReview } from "@/components/booking/quote-review";
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
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            {className}
          </p>
          <h1 className="font-heading text-4xl tracking-tight">{modelName}</h1>
          <p className="mt-2 text-muted-foreground">or similar</p>
        </header>

        {message ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="font-heading text-xl">Extras</legend>
          {extras.length === 0 ? (
            <p className="text-sm text-muted-foreground">No extras are configured.</p>
          ) : (
            extras.map((extra) => {
              const checked = extra.id in selected;
              return (
                <label
                  key={extra.id}
                  className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between"
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

        <div className="rounded-xl bg-card p-4 ring-1 ring-border">
          <Label htmlFor="promoCode">Promo code</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="promoCode"
              name="promoCode"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              autoComplete="off"
            />
            <Button type="button" variant="outline" onClick={onApplyPromo}>
              Apply
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
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        {preview ? <QuoteReview price={preview} live /> : null}
        <p className="text-xs text-muted-foreground">
          Preview only. The server recalculates the final quote before it is secured.
        </p>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Securing current price..." : "Secure this quote"}
        </Button>
      </aside>
    </form>
  );
}
