import { DateTime } from "luxon";

export function formatDate(date: Date | string, format="dd/MM/yyyy"): string {
  const dt = typeof date === "string" ? DateTime.fromISO(date) : DateTime.fromJSDate(date);
  return dt.toFormat(format);
}
