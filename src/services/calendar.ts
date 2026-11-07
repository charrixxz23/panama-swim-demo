import type { Competition } from "../models";

export type Phase = "proxima" | "en-curso" | "finalizada";
export type RegistrationState = "por-abrir" | "abierta" | "cerrada" | "finalizada";

/** Fase de una competencia respecto a hoy. Una competencia terminada nunca aparece como próxima. */
export function phase(c: Pick<Competition, "startDate" | "endDate">, today: string): Phase {
  if (today > c.endDate) return "finalizada";
  if (today >= c.startDate) return "en-curso";
  return "proxima";
}

export function registrationState(c: Pick<Competition, "registration" | "endDate">, today: string): RegistrationState {
  if (today > c.endDate) return "finalizada";
  if (today < c.registration.opens) return "por-abrir";
  if (today <= c.registration.closes) return "abierta";
  return "cerrada";
}

export const REGISTRATION_LABEL: Record<RegistrationState, string> = {
  "por-abrir": "Inscripción por abrir",
  abierta: "Inscripción abierta",
  cerrada: "Inscripción cerrada",
  finalizada: "Competencia finalizada",
};

export const PHASE_LABEL: Record<Phase, string> = {
  proxima: "Próxima",
  "en-curso": "En curso",
  finalizada: "Finalizada",
};

/** Próximas (incluye en curso) ordenadas por fecha ascendente. */
export const upcoming = <T extends Competition>(list: T[], today: string) =>
  list.filter((c) => phase(c, today) !== "finalizada").sort((a, b) => a.startDate.localeCompare(b.startDate));

/** Finalizadas ordenadas de la más reciente a la más antigua. */
export const past = <T extends Competition>(list: T[], today: string) =>
  list.filter((c) => phase(c, today) === "finalizada").sort((a, b) => b.endDate.localeCompare(a.endDate));
