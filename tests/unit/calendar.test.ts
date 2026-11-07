import { describe, expect, it } from "vitest";
import seed from "../../src/data/demo-dataset.json";
import type { Dataset } from "../../src/models";
import { past, phase, registrationState, upcoming } from "../../src/services/calendar";
import { categoryFor } from "../../src/services/categories";

const data = seed as Dataset;
const c = { startDate: "2026-12-04", endDate: "2026-12-06", registration: { opens: "2026-11-02", closes: "2026-11-25" } };

describe("fases y estado de inscripción", () => {
  it("calcula la fase respecto a hoy", () => {
    expect(phase(c, "2026-11-07")).toBe("proxima");
    expect(phase(c, "2026-12-05")).toBe("en-curso");
    expect(phase(c, "2026-12-07")).toBe("finalizada");
  });
  it("calcula la inscripción", () => {
    expect(registrationState(c, "2026-10-30")).toBe("por-abrir");
    expect(registrationState(c, "2026-11-02")).toBe("abierta");
    expect(registrationState(c, "2026-11-25")).toBe("abierta");
    expect(registrationState(c, "2026-11-26")).toBe("cerrada");
    expect(registrationState(c, "2026-12-07")).toBe("finalizada");
  });
  it("nunca muestra como próxima una competencia vencida", () => {
    for (const today of ["2026-11-07", "2027-02-01", "2027-06-01"]) {
      const next = upcoming(data.competitions, today);
      expect(next.every((x) => x.endDate >= today)).toBe(true);
      expect(past(data.competitions, today).every((x) => x.endDate < today)).toBe(true);
      expect(next.length + past(data.competitions, today).length).toBe(data.competitions.length);
    }
  });
});

describe("categorías por año de nacimiento", () => {
  it("asigna la categoría según la edad en el año de la competencia", () => {
    expect(categoryFor(data.categories, 2012, "2026-12-04")).toBe("13-14");
    expect(categoryFor(data.categories, 2012, "2027-03-19")).toBe("15-17");
    expect(categoryFor(data.categories, 2016, "2026-01-23")).toBe("9-10");
    expect(categoryFor(data.categories, 2000, "2026-01-23")).toBe("18+");
    expect(categoryFor(data.categories, 2019, "2026-01-23")).toBeNull();
  });
});
