import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formato de moneda en Euros (€)
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0,00 €";
  }
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const DEFAULT_TIMEZONE = "Europe/Madrid";

// Formato de fecha legible en español (ej. "15 oct 2026") en la zona horaria de la empresa
export function formatDate(
  dateStr: string | Date | null | undefined,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  if (!dateStr) return "-";
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat("es-ES", {
      timeZone,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

// Formato de fecha y hora (ej. "15 oct, 10:30 h") en la zona horaria de la empresa
export function formatDateTime(
  dateStr: string | Date | null | undefined,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  if (!dateStr) return "-";
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return (
      new Intl.DateTimeFormat("es-ES", {
        timeZone,
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date) + " h"
    );
  } catch {
    return String(dateStr);
  }
}

// Obtiene el valor formateado para inputs datetime-local (YYYY-MM-DDTHH:mm) en la zona horaria de la empresa
export function getLocalDatetimeInputValue(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
  } catch {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }
}

// Obtiene la clave de fecha (YYYY-MM-DD) en la zona horaria de la empresa para comparar días en agenda sin error UTC
export function getLocalDateString(
  dateStrOrObj: string | Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): string {
  try {
    const d = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
    if (isNaN(d.getTime())) {
      return typeof dateStrOrObj === "string" ? dateStrOrObj.slice(0, 10) : "";
    }
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return String(dateStrOrObj).slice(0, 10);
  }
}

// Convierte un string de input datetime-local (YYYY-MM-DDTHH:mm) interpretado en timeZone a un ISO UTC estricto
export function parseDateTimeInZone(
  datetimeStr: string,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  try {
    const [datePart, timePart] = datetimeStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = (timePart || "00:00").split(":").map(Number);
    const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const formattedUtc = Date.UTC(
      Number(m.year),
      Number(m.month) - 1,
      Number(m.day),
      Number(m.hour),
      Number(m.minute)
    );
    const diffMs = formattedUtc - guess.getTime();
    return new Date(guess.getTime() - diffMs).toISOString();
  } catch {
    return new Date(datetimeStr).toISOString();
  }
}

// Colores e insignias por gremio
export const GREMIOS = [
  "Albañilería",
  "Fontanería",
  "Pladur",
  "Cerrajería",
  "Electricidad",
  "Pintura",
  "Carpintería",
  "Climatización",
  "General",
] as const;

export type GremioType = (typeof GREMIOS)[number];

export function getGremioBadgeClasses(gremio: string): string {
  switch (gremio) {
    case "Fontanería":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800";
    case "Albañilería":
      return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800";
    case "Pladur":
      return "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800";
    case "Cerrajería":
      return "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    case "Electricidad":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800";
    case "Pintura":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800";
    case "Carpintería":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}
