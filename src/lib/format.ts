import { format } from "date-fns";

export const DEFAULT_CURRENCY = "USD";

export function formatCurrency(
  value: number,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return formatCurrency(value, DEFAULT_CURRENCY, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function formatPercent(value: number, { signed = false } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value / 100);
}

export function formatShares(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);
}

export function formatDate(date: Date) {
  return format(date, "MMM d, yyyy");
}

/** `YYYY-MM-DD` for <input type="date">, in local time. */
export function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/**
 * Transactions are stored at 12:00 UTC on their calendar day so the day stays
 * the same when rendered in any timezone within ±11h.
 */
export function fromDateInputValue(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}
