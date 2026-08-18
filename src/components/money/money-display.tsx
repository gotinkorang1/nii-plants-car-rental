import { formatGhs } from "@/lib/money";
import { cn } from "@/lib/utils";

export function MoneyDisplay({
  amountPesewas,
  suffix,
  emphasize = false,
  placeholder = "Quote on request",
}: {
  amountPesewas?: number | null;
  suffix?: string;
  emphasize?: boolean;
  placeholder?: string;
}) {
  const hasAmount = typeof amountPesewas === "number" && amountPesewas > 0;

  return (
    <span className={cn(emphasize && "text-lg font-medium")}>
      {hasAmount ? formatGhs(amountPesewas) : placeholder}
      {hasAmount && suffix ? (
        <span className="text-sm font-normal text-muted-foreground"> {suffix}</span>
      ) : null}
    </span>
  );
}
