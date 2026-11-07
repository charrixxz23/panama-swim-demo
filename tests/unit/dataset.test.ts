import { describe, expect, it } from "vitest";
import seed from "../../src/data/demo-dataset.json";
import { NEWS, SITE } from "../../src/data/reference";
import { TOUR_STEPS } from "../../src/data/tour";
import type { Dataset } from "../../src/models";
import { categoryFor } from "../../src/services/categories";
import { personalBests, swimmerRows } from "../../src/services/queries";

const data = seed as Dataset;

describe("datos demostrativos", () => {
  it("todo lo que representa personas, clubes, competencias, resultados y marcas es sintético", () => {
    for (const list of [data.swimmers, data.clubs, data.coaches, data.competitions, data.standards]) expect(list.every((x) => x.synthetic === true)).toBe(true);
    expect(data.results.every((r) => r.source === "demo")).toBe(true);
  });

  it("los clubes ficticios llevan «Demo» en el nombre y las sedes ficticias también", () => {
    expect(data.clubs.every((c) => c.name.startsWith("Club Demo"))).toBe(true);
    expect(data.pools.filter((p) => !p.real).every((p) => p.name.includes("Demo"))).toBe(true);
  });

  it("no guarda datos personales sensibles: solo año de nacimiento, sin contacto ni documentos", () => {
    const keys = new Set(data.swimmers.flatMap((s) => Object.keys(s)));
    expect([...keys].sort()).toEqual(["birthYear", "clubId", "firstName", "gender", "id", "lastName", "published", "synthetic"]);
    expect(data.swimmers.every((s) => Number.isInteger(s.birthYear))).toBe(true);
  });

  it("los tiempos son milisegundos enteros en centésimas y los DQ/DNS/DNF no tienen tiempo", () => {
    for (const r of data.results) {
      if (r.status === "OK") expect(Number.isInteger(r.timeMs) && r.timeMs! % 10 === 0 && r.timeMs! > 0).toBe(true);
      else expect(r.timeMs).toBeNull();
    }
    expect(data.standards.every((s) => Number.isInteger(s.timeMs) && s.timeMs % 10 === 0)).toBe(true);
  });

  it("cada resultado apunta a una prueba de su competencia y a un nadador de la categoría y rama correctas", () => {
    const ev = new Map(data.events.map((e) => [e.id, e]));
    const sw = new Map(data.swimmers.map((s) => [s.id, s]));
    const comp = new Map(data.competitions.map((c) => [c.id, c]));
    for (const r of data.results) {
      const e = ev.get(r.eventId)!;
      const s = sw.get(r.swimmerId)!;
      expect(e.competitionId).toBe(r.competitionId);
      expect(s.gender).toBe(e.gender);
      expect(categoryFor(data.categories, s.birthYear, comp.get(r.competitionId)!.startDate)).toBe(e.categoryId);
    }
  });

  it("no hay dos resultados del mismo nadador en la misma prueba", () => {
    const keys = data.results.map((r) => `${r.eventId}|${r.swimmerId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("las marcas mínimas usan la piscina de su competencia", () => {
    const comp = new Map(data.competitions.map((c) => [c.id, c]));
    for (const s of data.standards) expect(s.course).toBe(comp.get(s.competitionId)!.course);
  });

  it("incluye la progresión del ejemplo: Daniel Pérez, 100 m libre, 50 m", () => {
    const rows = swimmerRows(data, "daniel-perez").filter((r) => r.event.distance === 100 && r.event.stroke === "LIBRE" && r.course === "LCM");
    expect(rows.map((r) => [r.date.slice(5, 7), r.result.timeMs])).toEqual([
      ["01", 74200],
      ["03", 71800],
      ["05", 69500],
      ["07", 67100],
      ["09", 64800],
    ]);
    expect(personalBests(swimmerRows(data, "daniel-perez")).find((b) => b.key === "100-LIBRE-LCM")?.timeMs).toBe(64800);
    expect(data.standards.find((s) => s.id === "mm-nacional-lcm-2026-13-14-M-100-LIBRE")?.timeMs).toBe(62000);
  });
});

describe("textos obligatorios y recorrido", () => {
  it("el aviso de independencia es el pedido", () => {
    expect(SITE.disclaimer).toBe(
      "Prototipo académico independiente inspirado en la natación panameña. No representa una plataforma oficial de la Federación Panameña de Natación.",
    );
    expect(SITE.author.url).toBe("https://github.com/charrixxz23");
  });
  it("las noticias citan medio, fecha y enlace https", () => {
    for (const n of NEWS) {
      expect(n.url).toMatch(/^https:\/\//);
      expect(n.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("el recorrido tiene 10 pasos con ruta y objetivo", () => {
    expect(TOUR_STEPS).toHaveLength(10);
    for (const s of TOUR_STEPS) {
      expect(s.route.startsWith("/")).toBe(true);
      expect(s.target).toMatch(/^\[data-tour="[\w-]+"\]$/);
    }
  });
});
