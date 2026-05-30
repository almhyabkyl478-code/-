import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse dates stored as DD-MM-YYYY or ISO strings into a JS Date.
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // ISO / YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
  // DD-MM-YYYY
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[2].length === 4) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date(dateStr);
}

export function formatDateAr(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr || "-";
  return d.toLocaleDateString("ar-SA");
}

export function formatDateEn(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr || "-";
  return d.toLocaleDateString("en-GB");
}

/** Convert YYYY-MM-DD (from <input type="date">) to DD-MM-YYYY for the API */
export function isoToDdMmYyyy(isoDate: string): string {
  if (!isoDate) return isoDate;
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}
