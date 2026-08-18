export function assertIntegerPesewas(value: unknown, label = "amount"): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be stored as an integer number of pesewas.`);
  }

  if (value < 0) {
    throw new Error(`${label} cannot be negative.`);
  }

  return value;
}

export function pesewasToGhs(pesewas: number): number {
  const amount = assertIntegerPesewas(pesewas, "pesewas");
  return amount / 100;
}

export function pesewasToGhsInput(pesewas: number): string {
  const amount = assertIntegerPesewas(pesewas, "pesewas");
  const cedis = Math.trunc(amount / 100);
  const remainder = amount % 100;
  return `${cedis}.${String(remainder).padStart(2, "0")}`;
}

export function ghsToPesewas(value: string, label = "amount"): number {
  return ghsInputToPesewas(value, label);
}

export function ghsInputToPesewas(value: string, label = "amount"): number {
  const trimmed = value.trim();

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(
      `${label} must be a GHS amount with up to two decimal places.`,
    );
  }

  const [cedisPart, pesewasPart = ""] = trimmed.split(".");
  return (
    Number.parseInt(cedisPart, 10) * 100 +
    Number.parseInt(pesewasPart.padEnd(2, "0") || "0", 10)
  );
}

export function formatGhs(pesewas: number): string {
  const cedis = pesewasToGhs(pesewas);
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cedis);
}

export function calculatePercentage(pesewas: number, percent: number): number {
  const amount = assertIntegerPesewas(pesewas, "pesewas");

  if (typeof percent !== "number" || !Number.isInteger(percent)) {
    throw new Error("Percent must be an integer.");
  }

  if (percent < 0 || percent > 100) {
    throw new Error("Percent must be between 0 and 100.");
  }

  return Math.trunc((amount * percent) / 100);
}
