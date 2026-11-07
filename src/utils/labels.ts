import type { CompetitionType, Course, Gender, ResultStatus, Stroke } from "../models";

export const STROKES: Record<Stroke, string> = {
  LIBRE: "Libre",
  ESPALDA: "Espalda",
  PECHO: "Pecho",
  MARIPOSA: "Mariposa",
  COMBINADO: "Combinado",
};

export const COURSES: Record<Course, { short: string; long: string }> = {
  LCM: { short: "50 m", long: "Piscina larga (50 m)" },
  SCM: { short: "25 m", long: "Piscina corta (25 m)" },
};

export const GENDERS: Record<Gender, string> = { F: "Femenino", M: "Masculino" };

export const STATUS: Record<ResultStatus, { short: string; long: string }> = {
  OK: { short: "Válido", long: "Resultado válido" },
  DQ: { short: "DQ", long: "Descalificado" },
  DNS: { short: "DNS", long: "No se presentó" },
  DNF: { short: "DNF", long: "No terminó" },
};

export const COMP_TYPES: Record<CompetitionType, string> = {
  evaluativa: "Evaluativa",
  campeonato: "Campeonato",
  copa: "Copa",
  open: "Open",
  selectivo: "Selectivo",
};

export const eventLabel = (distance: number, stroke: Stroke) => `${distance} m ${STROKES[stroke].toLowerCase()}`;
