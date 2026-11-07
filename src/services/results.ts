import type { Result } from "../models";

export interface RankedResult extends Result {
  /** Posición (empates comparten posición). null para DQ/DNS/DNF. */
  place: number | null;
  /** Diferencia respecto al primer lugar en ms. null si no hay tiempo válido. */
  behindMs: number | null;
}

const STATUS_ORDER = { OK: 0, DQ: 1, DNF: 2, DNS: 3 } as const;

/**
 * Clasifica los resultados de UNA prueba: tiempos válidos de menor a mayor, empates con la misma
 * posición, y después DQ, DNF y DNS sin posición ni tiempo.
 */
export function rankEvent(results: Result[]): RankedResult[] {
  const valid = results.filter((r) => r.status === "OK" && r.timeMs !== null).sort((a, b) => a.timeMs! - b.timeMs!);
  const others = results
    .filter((r) => r.status !== "OK" || r.timeMs === null)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.heat - b.heat || a.lane - b.lane);
  const best = valid[0]?.timeMs ?? null;
  let lastTime: number | null = null;
  let lastPlace = 0;
  const ranked: RankedResult[] = valid.map((r, i) => {
    const place = r.timeMs === lastTime ? lastPlace : i + 1;
    lastTime = r.timeMs;
    lastPlace = place;
    return { ...r, place, behindMs: best === null ? null : r.timeMs! - best };
  });
  return [...ranked, ...others.map((r) => ({ ...r, place: null, behindMs: null }))];
}
