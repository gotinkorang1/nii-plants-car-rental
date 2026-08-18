export const BUSINESS_TIMEZONE = "Africa/Accra";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function isValidClockTime(value: string): boolean {
  if (!TIME_PATTERN.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Interpret a customer date + time as Africa/Accra local time.
 * Accra is UTC+0 year-round, so the stored timestamptz instant matches
 * the displayed clock time.
 */
export function accraDateTimeToUtc(date: string, time: string): Date {
  if (!isValidIsoDate(date) || !isValidClockTime(time)) {
    throw new Error("Enter a valid pickup or return date and time.");
  }

  return new Date(`${date}T${time}:00+00:00`);
}

export function utcToAccraDateInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function utcToAccraTimeInput(value: Date): string {
  return value.toISOString().slice(11, 16);
}
