import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import seed from "../../src/data/demo-dataset.json";
import type { Dataset } from "../../src/models";
import { parseCsv, validateResultsCsv } from "../../src/services/csv";

const data = seed as Dataset;
const HEADER = "competencia_id,prueba_id,nadador_id,serie,carril,tiempo,estado";

describe("parseCsv", () => {
  it("maneja BOM, comillas, comillas escapadas, punto y coma y líneas vacías", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","di ""hola"""\n\n')).toEqual([
      ["a", "b"],
      ["x, y", 'di "hola"'],
    ]);
    expect(parseCsv("a;b;c\n1;2;3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });
});

describe("validateResultsCsv", () => {
  it("acepta el CSV de ejemplo incluido en public/samples", () => {
    const v = validateResultsCsv(readFileSync("public/samples/resultados-copa-azuero-demo.csv", "utf8"), data);
    expect(v.errors).toEqual([]);
    expect(v.valid.length).toBe(v.totalRows);
    expect(v.valid.every((r) => r.source === "importado")).toBe(true);
    // DNS sin tiempo
    expect(v.valid.filter((r) => r.status === "DNS").every((r) => r.timeMs === null)).toBe(true);
  });

  it("detecta todos los errores del CSV de ejemplo con errores", () => {
    const v = validateResultsCsv(readFileSync("public/samples/resultados-con-errores-demo.csv", "utf8"), data);
    const msgs = v.errors.map((e) => `${e.line}:${e.column ?? ""}`);
    expect(msgs).toContain("3:nadador_id"); // duplicado en el archivo
    expect(msgs).toContain("4:nadador_id"); // nadador inexistente
    expect(msgs).toContain("5:tiempo"); // 1:75.20
    expect(msgs).toContain("6:serie"); // "uno"
    expect(msgs).toContain("6:tiempo"); // OK sin tiempo
    expect(msgs).toContain("7:estado"); // TARDE
  });

  it("exige las columnas obligatorias", () => {
    const v = validateResultsCsv("competencia_id,prueba_id\nx,y", data);
    expect(v.errors[0].message).toMatch(/Faltan columnas obligatorias/);
    expect(v.valid).toEqual([]);
  });

  it("rechaza la categoría o la rama equivocadas", () => {
    const ev = data.events.find((e) => e.competitionId === "copa-azuero-2026" && e.categoryId === "18+" && e.gender === "M")!;
    const v = validateResultsCsv(`${HEADER}\ncopa-azuero-2026,${ev.id},daniel-perez,1,4,1:00.00,OK`, data);
    expect(v.errors.some((e) => /categoría/.test(e.message))).toBe(true);
    const evF = data.events.find((e) => e.competitionId === "copa-azuero-2026" && e.categoryId === "13-14" && e.gender === "F")!;
    const v2 = validateResultsCsv(`${HEADER}\ncopa-azuero-2026,${evF.id},daniel-perez,1,4,1:00.00,OK`, data);
    expect(v2.errors.some((e) => /rama/.test(e.message))).toBe(true);
  });

  it("rechaza una prueba de otra competencia y duplicados con los datos existentes", () => {
    const other = data.events.find((e) => e.competitionId === "evaluativa-1-2026")!;
    const v = validateResultsCsv(`${HEADER}\ncopa-azuero-2026,${other.id},daniel-perez,1,4,1:00.00,OK`, data);
    expect(v.errors.some((e) => /no pertenece/.test(e.message))).toBe(true);
    const existing = data.results.find((r) => r.swimmerId === "daniel-perez")!;
    const v2 = validateResultsCsv(`${HEADER}\n${existing.competitionId},${existing.eventId},daniel-perez,2,1,1:10.00,OK`, data);
    expect(v2.errors.some((e) => /ya existe/.test(e.message))).toBe(true);
  });

  it("no convierte un DQ en tiempo y avisa si trae uno", () => {
    const ev = data.events.find((e) => e.competitionId === "copa-azuero-2026" && e.categoryId === "13-14" && e.gender === "M" && e.distance === 100 && e.stroke === "LIBRE")!;
    const v = validateResultsCsv(`${HEADER}\ncopa-azuero-2026,${ev.id},daniel-perez,1,4,1:03.00,DQ`, data);
    expect(v.errors).toEqual([]);
    expect(v.valid[0]).toMatchObject({ status: "DQ", timeMs: null });
    expect(v.warnings[0].message).toMatch(/se ignora/);
  });

  it("detecta el mismo carril dos veces en una serie", () => {
    const ev = data.events.find((e) => e.competitionId === "copa-azuero-2026" && e.categoryId === "13-14" && e.gender === "M" && e.distance === 100 && e.stroke === "LIBRE")!;
    const others = data.swimmers.filter((s) => s.gender === "M" && s.birthYear === 2012 && s.id !== "daniel-perez");
    const v = validateResultsCsv(`${HEADER}\ncopa-azuero-2026,${ev.id},daniel-perez,1,4,1:03.00,OK\ncopa-azuero-2026,${ev.id},${others[0].id},1,4,1:04.00,OK`, data);
    expect(v.errors.some((e) => e.column === "carril")).toBe(true);
  });

  it("informa archivo vacío", () => {
    expect(validateResultsCsv("", data).errors[0].message).toMatch(/vacío/);
    expect(validateResultsCsv(HEADER, data).errors[0].message).toMatch(/no tiene filas/);
  });
});
