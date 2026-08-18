export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return trimmed;
  }
  return hasPlus ? `+${digits}` : digits;
}

export function normalizePersonName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeLicenceCountry(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeLicenceNumber(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}
