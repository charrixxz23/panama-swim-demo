import type { CategoryId, Course, Gender, QualifyingStandard, Result, Stroke, SwimEvent } from "../models";

export interface StandardQuery {
  competitionId: string;
  categoryId: CategoryId;
  gender: Gender;
  distance: number;
  stroke: Stroke;
  course: Course;
}

/**
 * Busca la marca mínima EXACTA: misma competencia, categoría, rama, distancia, estilo y piscina.
 * Si no existe, devuelve undefined. Nunca se usa una marca de otra piscina ni de otra prueba.
 */
export const findStandard = (standards: QualifyingStandard[], q: StandardQuery) =>
  standards.find(
    (s) =>
      s.published &&
      s.competitionId === q.competitionId &&
      s.categoryId === q.categoryId &&
      s.gender === q.gender &&
      s.distance === q.distance &&
      s.stroke === q.stroke &&
      s.course === q.course,
  );

export interface Comparison {
  /** Tiempo del nadador − marca mínima. Positivo = le falta; cero o negativo = alcanza. */
  diffMs: number;
  /** Diferencia relativa respecto a la marca mínima, en %. */
  percent: number;
  meets: boolean;
  /** Proporción para la barra de avance: marca / tiempo (1 = alcanza). */
  progress: number;
}

export function compareToStandard(timeMs: number, standardMs: number): Comparison {
  if (!Number.isInteger(timeMs) || !Number.isInteger(standardMs) || timeMs <= 0 || standardMs <= 0)
    throw new RangeError("Los tiempos deben ser milisegundos enteros positivos");
  const diffMs = timeMs - standardMs;
  return {
    diffMs,
    percent: Math.round((diffMs / standardMs) * 10000) / 100,
    meets: diffMs <= 0,
    progress: Math.min(1, standardMs / timeMs),
  };
}

export interface PerformanceRow {
  result: Result;
  event: SwimEvent;
  course: Course;
  date: string;
}

/** Mejor tiempo válido de un nadador en una prueba y piscina concretas (nunca mezcla 25 y 50 m). */
export function bestTime(rows: PerformanceRow[], distance: number, stroke: Stroke, course: Course) {
  return rows
    .filter((r) => r.result.status === "OK" && r.result.timeMs !== null && r.event.distance === distance && r.event.stroke === stroke && r.course === course)
    .sort((a, b) => a.result.timeMs! - b.result.timeMs! || a.date.localeCompare(b.date))[0];
}
