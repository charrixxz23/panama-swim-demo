import type { Competition, Course, Dataset, Result, Stroke, Swimmer, SwimEvent } from "../models";
import { eventKey } from "../models";
import { categoryFor } from "./categories";
import type { PerformanceRow } from "./standards";

/** Vista pública: solo registros publicados. */
export const publicCompetitions = (d: Dataset) => d.competitions.filter((c) => c.published);
export const publicResults = (d: Dataset) => {
  const pub = new Set(publicCompetitions(d).map((c) => c.id));
  return d.results.filter((r) => r.published && pub.has(r.competitionId));
};
export const publicSwimmers = (d: Dataset) => d.swimmers.filter((s) => s.published);

export const fullName = (s: Pick<Swimmer, "firstName" | "lastName">) => `${s.firstName} ${s.lastName}`;

export interface Indexes {
  comp: Map<string, Competition>;
  event: Map<string, SwimEvent>;
  swimmer: Map<string, Swimmer>;
  club: Map<string, Dataset["clubs"][number]>;
  pool: Map<string, Dataset["pools"][number]>;
}

export const indexes = (d: Dataset): Indexes => ({
  comp: new Map(d.competitions.map((c) => [c.id, c])),
  event: new Map(d.events.map((e) => [e.id, e])),
  swimmer: new Map(d.swimmers.map((s) => [s.id, s])),
  club: new Map(d.clubs.map((c) => [c.id, c])),
  pool: new Map(d.pools.map((p) => [p.id, p])),
});

/** Historial de un nadador con la prueba, la piscina y la fecha de cada resultado. */
export function swimmerRows(d: Dataset, swimmerId: string, ix = indexes(d)): PerformanceRow[] {
  return publicResults(d)
    .filter((r) => r.swimmerId === swimmerId)
    .map((r) => {
      const c = ix.comp.get(r.competitionId)!;
      return { result: r, event: ix.event.get(r.eventId)!, course: c.course, date: c.startDate };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface BestMark {
  key: string;
  distance: number;
  stroke: Stroke;
  course: Course;
  timeMs: number;
  result: Result;
  date: string;
  races: number;
}

/** Mejores marcas personales por prueba Y piscina (25 m y 50 m se listan por separado). */
export function personalBests(rows: PerformanceRow[]): BestMark[] {
  const groups = new Map<string, PerformanceRow[]>();
  for (const r of rows) {
    const key = eventKey(r.event.distance, r.event.stroke, r.course);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const out: BestMark[] = [];
  for (const [key, list] of groups) {
    const best = list
      .filter((r) => r.result.status === "OK" && r.result.timeMs !== null)
      .sort((a, b) => a.result.timeMs! - b.result.timeMs! || a.date.localeCompare(b.date))[0];
    if (!best) continue;
    out.push({ key, distance: best.event.distance, stroke: best.event.stroke, course: best.course, timeMs: best.result.timeMs!, result: best.result, date: best.date, races: list.length });
  }
  const order: Stroke[] = ["LIBRE", "ESPALDA", "PECHO", "MARIPOSA", "COMBINADO"];
  return out.sort((a, b) => a.course.localeCompare(b.course) || order.indexOf(a.stroke) - order.indexOf(b.stroke) || a.distance - b.distance);
}

export const currentCategory = (d: Dataset, s: Swimmer, today: string) => categoryFor(d.categories, s.birthYear, today);
