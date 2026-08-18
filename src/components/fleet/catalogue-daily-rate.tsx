import { MoneyDisplay } from "@/components/money/money-display";
import { formatUsdDailyRate } from "@/lib/money";

export function CatalogueDailyRate({
  usdDailyRateFrom,
  usdDailyRateTo,
  dailyRatePesewas,
  emphasize = false,
}: {
  usdDailyRateFrom: number | null;
  usdDailyRateTo: number | null;
  dailyRatePesewas: number;
  emphasize?: boolean;
}) {
  if (usdDailyRateFrom) {
    return (
      <span className={emphasize ? "text-lg font-medium" : undefined}>
        {formatUsdDailyRate(usdDailyRateFrom, usdDailyRateTo)}
        <span className="text-sm font-normal text-muted-foreground"> / day</span>
      </span>
    );
  }

  return (
    <MoneyDisplay
      amountPesewas={dailyRatePesewas}
      suffix="/ day"
      emphasize={emphasize}
      placeholder="quote on request"
    />
  );
}
