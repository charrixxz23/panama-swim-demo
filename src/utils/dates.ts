/** Fechas en hora de Panamá (UTC−5, sin horario de verano). Todas las fechas son AAAA-MM-DD. */

declare global {
  interface Window {
    /** Solo para pruebas y presentaciones: fija la fecha "de hoy" (AAAA-MM-DD). */
    __PS_TODAY__?: string;
  }
}

export function todayISO(): string {
  if (typeof window !== "undefined" && window.__PS_TODAY__) return window.__PS_TODAY__;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

const asDate = (iso: string) => new Date(`${iso}T12:00:00-05:00`);

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  new Intl.DateTimeFormat("es-PA", { timeZone: "America/Panama", ...opts }).format(asDate(iso));

export function formatRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  const [ys, ms] = start.split("-");
  const [ye, me] = end.split("-");
  if (ys === ye && ms === me) return `${Number(start.slice(8))}–${formatDate(end)}`;
  if (ys === ye) return `${formatDate(start, { day: "numeric", month: "long" })} – ${formatDate(end)}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export const addDays = (iso: string, n: number) => {
  const d = asDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const monthKey = (iso: string) => iso.slice(0, 7);

/** Edad que cumple el atleta en el año de la competencia (convención por año de nacimiento). */
export const ageInYear = (birthYear: number, isoDate: string) => Number(isoDate.slice(0, 4)) - birthYear;
