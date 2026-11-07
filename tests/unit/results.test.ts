import { describe, expect, it } from "vitest";
import type { Result } from "../../src/models";
import { rankEvent } from "../../src/services/results";

const r = (id: string, timeMs: number | null, status: Result["status"] = "OK", lane = 1): Result => ({ id, competitionId: "c", eventId: "e", swimmerId: id, heat: 1, lane, timeMs, status, source: "demo", published: true });

describe("rankEvent", () => {
  const ranked = rankEvent([r("lento", 61000), r("dq", null, "DQ"), r("rapido", 59000), r("dns", null, "DNS"), r("empate1", 60000, "OK", 2), r("empate2", 60000, "OK", 3), r("dnf", null, "DNF")]);
  it("ordena de menor a mayor tiempo con diferencia respecto al primero", () => {
    expect(ranked.slice(0, 4).map((x) => [x.id, x.place, x.behindMs])).toEqual([
      ["rapido", 1, 0],
      ["empate1", 2, 1000],
      ["empate2", 2, 1000],
      ["lento", 4, 2000],
    ]);
  });
  it("deja DQ, DNF y DNS al final, sin posición ni tiempo", () => {
    expect(ranked.slice(4).map((x) => [x.id, x.place, x.behindMs, x.timeMs])).toEqual([
      ["dq", null, null, null],
      ["dnf", null, null, null],
      ["dns", null, null, null],
    ]);
  });
  it("funciona con una prueba sin tiempos válidos", () => {
    expect(rankEvent([r("dq", null, "DQ")])[0].place).toBeNull();
  });
});
