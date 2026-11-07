import { describe, expect, it } from "vitest";
import type { QualifyingStandard, Result, SwimEvent } from "../../src/models";
import { bestTime, compareToStandard, findStandard, type PerformanceRow } from "../../src/services/standards";
import { parseTime } from "../../src/utils/time";

const std = (over: Partial<QualifyingStandard> = {}): QualifyingStandard => ({
  id: "x",
  competitionId: "nac",
  categoryId: "13-14",
  gender: "M",
  distance: 100,
  stroke: "LIBRE",
  course: "LCM",
  timeMs: 62000,
  synthetic: true,
  published: true,
  ...over,
});

describe("compareToStandard", () => {
  it("reproduce el ejemplo del enunciado: 1:04.80 frente a 1:02.00", () => {
    const c = compareToStandard(parseTime("1:04.80"), parseTime("1:02.00"));
    expect(c.diffMs).toBe(2800);
    expect(c.meets).toBe(false);
    expect(c.percent).toBe(4.52);
    expect(c.progress).toBeCloseTo(62000 / 64800, 10);
  });
  it("alcanzar o mejorar la marca cuenta como alcanzada", () => {
    expect(compareToStandard(62000, 62000)).toMatchObject({ diffMs: 0, meets: true, percent: 0, progress: 1 });
    expect(compareToStandard(61580, 62000)).toMatchObject({ diffMs: -420, meets: true });
  });
  it("menos tiempo es mejor: un tiempo mayor nunca alcanza", () => {
    expect(compareToStandard(62010, 62000).meets).toBe(false);
  });
  it("rechaza tiempos que no son milisegundos enteros positivos", () => {
    expect(() => compareToStandard(64.8, 62000)).toThrow(RangeError);
    expect(() => compareToStandard(0, 62000)).toThrow(RangeError);
    expect(() => compareToStandard(64800, -1)).toThrow(RangeError);
  });
});

describe("findStandard", () => {
  const list = [std(), std({ id: "scm", course: "SCM", timeMs: 60500 }), std({ id: "draft", competitionId: "otra", published: false })];
  const q = { competitionId: "nac", categoryId: "13-14" as const, gender: "M" as const, distance: 100, stroke: "LIBRE" as const, course: "LCM" as const };
  it("encuentra solo la combinación exacta", () => {
    expect(findStandard(list, q)?.id).toBe("x");
  });
  it("no usa una marca de otra piscina (sin conversiones)", () => {
    expect(findStandard([std({ course: "SCM" })], q)).toBeUndefined();
  });
  it("no compara pruebas diferentes", () => {
    expect(findStandard(list, { ...q, distance: 200 })).toBeUndefined();
    expect(findStandard(list, { ...q, stroke: "ESPALDA" })).toBeUndefined();
    expect(findStandard(list, { ...q, gender: "F" })).toBeUndefined();
    expect(findStandard(list, { ...q, categoryId: "15-17" })).toBeUndefined();
  });
  it("ignora marcas no publicadas", () => {
    expect(findStandard(list, { ...q, competitionId: "otra" })).toBeUndefined();
  });
});

describe("bestTime", () => {
  const ev = (d: number, s: SwimEvent["stroke"]): SwimEvent => ({ id: `${d}${s}`, competitionId: "c", number: 1, distance: d, stroke: s, gender: "M", categoryId: "13-14" });
  const res = (id: string, timeMs: number | null, status: Result["status"] = "OK"): Result => ({ id, competitionId: "c", eventId: "e", swimmerId: "s", heat: 1, lane: 4, timeMs, status, source: "demo", published: true });
  const rows: PerformanceRow[] = [
    { result: res("a", 64800), event: ev(100, "LIBRE"), course: "LCM", date: "2026-09-18" },
    { result: res("b", 63000), event: ev(100, "LIBRE"), course: "SCM", date: "2026-10-09" },
    { result: res("c", null, "DQ"), event: ev(100, "LIBRE"), course: "LCM", date: "2026-10-20" },
    { result: res("d", 67100), event: ev(100, "LIBRE"), course: "LCM", date: "2026-07-17" },
  ];
  it("devuelve el menor tiempo válido en la piscina pedida", () => {
    expect(bestTime(rows, 100, "LIBRE", "LCM")?.result.id).toBe("a");
    expect(bestTime(rows, 100, "LIBRE", "SCM")?.result.id).toBe("b");
  });
  it("ignora DQ y pruebas distintas", () => {
    expect(bestTime(rows, 50, "LIBRE", "LCM")).toBeUndefined();
  });
});
